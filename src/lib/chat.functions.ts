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
    // The provider endpoint is single-shot Q&A. We send only the most recent
    // user message as the "question".
    const lastUser = [...data.messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUser) throw new Error("No user message to send");

    const url = `https://apis.davidcyril.name.ng/ai/chat?question=${encodeURIComponent(lastUser.content)}`;

    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      const t = await res.text();
      console.error("Chat API error", res.status, t);
      throw new Error("AI request failed.");
    }

    const json = (await res.json()) as {
      success?: boolean;
      data?: { answer?: string };
    };

    if (!json.success || !json.data?.answer) {
      throw new Error("AI returned no answer.");
    }

    return { reply: json.data.answer };
  });
