import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        messages: z.array(messageSchema).min(1).max(50),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                "You are Mono, a minimalist AI assistant. Reply concisely in clean prose. Use markdown only when essential.",
            },
            ...data.messages,
          ],
        }),
      },
    );

    if (res.status === 429)
      throw new Error("Rate limit reached. Please wait a moment.");
    if (res.status === 402)
      throw new Error("AI credits exhausted. Add credits in workspace settings.");
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      throw new Error("AI request failed.");
    }

    const json = await res.json();
    const reply: string =
      json?.choices?.[0]?.message?.content ?? "(no response)";
    return { reply };
  });
