import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { sendChatMessage } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowUp, LogOut, Sparkles, Plus } from "lucide-react";

const SUGGESTIONS = [
  "Explain quantum computing simply",
  "Write a haiku about Mumbai rain",
  "Plan a 3-day Goa itinerary",
  "Debug: why is my useEffect looping?",
];

export const Route = createFileRoute("/chat")({
  component: HomePage,
});

type Msg = { role: "user" | "assistant"; content: string };

function HomePage() {
  const navigate = useNavigate();
  const chat = useServerFn(sendChatMessage);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
      else setPhone((session.user.user_metadata as any)?.phone ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/login" });
      else setPhone((data.session.user.user_metadata as any)?.phone ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendWith = async (text: string) => {
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await chat({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e: any) {
      toast.error(e?.message || "Chat failed");
      setMessages(messages);
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const send = () => sendWith(input.trim());

  const newChat = () => {
    if (loading) return;
    setMessages([]);
    setInput("");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* iOS-style top bar */}
      <header className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/50 backdrop-blur-xl sticky top-0 z-10 bg-background/80">
        <button
          onClick={newChat}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2"
          aria-label="New chat"
        >
          <Plus className="size-5" />
        </button>
        <div className="text-center">
          <h1 className="text-[15px] font-semibold tracking-tight">mono</h1>
          {phone && (
            <p className="text-[10px] text-muted-foreground">{phone}</p>
          )}
        </div>
        <button
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 -mr-2"
          aria-label="Sign out"
        >
          <LogOut className="size-5" />
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-2.5">
        {messages.length === 0 && (
          <div className="max-w-md mx-auto pt-10 space-y-7">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-card border border-border">
                <Sparkles className="size-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Ask anything
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                  A quiet, fast assistant. Black & white. No noise.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendWith(s)}
                  className="text-left text-[13px] leading-snug bg-card hover:bg-secondary border border-border rounded-2xl px-3.5 py-3 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Coming soon
              </p>
              <ul className="text-[13px] space-y-1.5 text-foreground/90">
                <li>· Voice input & spoken replies</li>
                <li>· Persistent chat history across devices</li>
                <li>· Image understanding</li>
                <li>· Custom personas & system prompts</li>
                <li>· Shareable conversation links</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === "user";
          const prev = messages[i - 1];
          const grouped = prev && prev.role === m.role;
          return (
            <div
              key={i}
              className={`flex ${isUser ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-2.5"}`}
            >
              <div
                className={`max-w-[80%] px-3.5 py-2 text-[15px] leading-[1.35] whitespace-pre-wrap shadow-sm ${
                  isUser
                    ? "bg-bubble-user text-bubble-user-foreground rounded-[20px] rounded-br-[6px]"
                    : "bg-bubble-ai text-bubble-ai-foreground rounded-[20px] rounded-bl-[6px]"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start mt-2.5">
            <div className="bg-bubble-ai text-bubble-ai-foreground rounded-[20px] rounded-bl-[6px] px-4 py-3">
              <div className="flex gap-1.5">
                <span className="size-1.5 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 rounded-full bg-muted-foreground/70 animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-4 pb-6 pt-2 border-t border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-end gap-2 bg-card border border-border rounded-3xl pl-4 pr-1.5 py-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Message"
            className="flex-1 bg-transparent resize-none py-2 text-[15px] focus:outline-none placeholder:text-muted-foreground max-h-32"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-opacity shrink-0"
          >
            <ArrowUp className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
