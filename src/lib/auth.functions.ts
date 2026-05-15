import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+\d{8,15}$/, "Phone must include country code, e.g. +919999999999");

export const sendOtp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ phone: phoneSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const phone = data.phone;

    // Rate limit: one OTP per number per 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from("otp_requests")
      .select("created_at")
      .eq("phone", phone)
      .gte("created_at", fiveMinAgo)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recent && recent.length > 0) {
      const last = new Date(recent[0].created_at).getTime();
      const wait = Math.ceil((5 * 60 * 1000 - (Date.now() - last)) / 1000);
      throw new Error(
        `Please wait ${wait}s before requesting another OTP for this number.`,
      );
    }

    // Call WhatsApp OTP endpoint (number without leading +)
    const numForApi = phone.replace(/^\+/, "");
    const url = `https://otwa91-061f2bfd95a4.herokuapp.com/num=${encodeURIComponent(numForApi)}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      throw new Error("Failed to send OTP. Try again later.");
    }
    const text = await res.text();

    // Endpoint returns HTML containing "Your OTP is: 123456"
    const match =
      text.match(/Your OTP is:\s*\*?\s*(\d{4,8})/i) ||
      text.match(/<div[^>]*id=["']otp["'][^>]*>\s*(\d{4,8})/i);
    if (!match) {
      console.error("OTP endpoint response:", text.slice(0, 500));
      throw new Error("Could not parse OTP from provider response.");
    }
    const otp = match[1];

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin.from("otp_requests").insert({
      phone,
      otp,
      expires_at: expiresAt,
    });
    if (error) throw new Error(error.message);

    return { ok: true };
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        phone: phoneSchema,
        otp: z.string().trim().regex(/^\d{4,8}$/),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { phone, otp } = data;

    const { data: rows } = await supabaseAdmin
      .from("otp_requests")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1);

    const row = rows?.[0];
    if (!row) throw new Error("No OTP requested for this number.");
    if (new Date(row.expires_at).getTime() < Date.now())
      throw new Error("OTP expired. Request a new one.");
    if (row.otp !== otp) throw new Error("Incorrect OTP.");

    // Build deterministic email from phone
    const email = `${phone.replace(/\D/g, "")}@phone.local`;
    // Generate fresh password every login
    const password =
      crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");

    // Find existing user by email
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const existing = list?.users.find((u) => u.email === email);

    let userId: string;
    if (existing) {
      userId = existing.id;
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password, email_confirm: true },
      );
      if (updErr) throw new Error(updErr.message);
    } else {
      const { data: created, error: cErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { phone },
        });
      if (cErr || !created.user) throw new Error(cErr?.message || "Signup failed");
      userId = created.user.id;
      await supabaseAdmin.from("profiles").insert({ id: userId, phone });
    }

    // Clean up used OTPs for this phone
    await supabaseAdmin.from("otp_requests").delete().eq("phone", phone);

    return { email, password };
  });
