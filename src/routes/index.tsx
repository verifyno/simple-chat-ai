import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Sparkles, MessageSquare, Feather, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const FEATURES = [
  { icon: MessageSquare, title: "Conversational AI", desc: "Ask anything. Get clean, focused answers." },
  { icon: Feather, title: "Effortless", desc: "Two taps to start. No clutter, no setup." },
  { icon: Zap, title: "Fast & minimal", desc: "Black & white. iOS-inspired. Zero noise." },
];

const SOON = [
  "Voice input & spoken replies",
  "Persistent chat history across devices",
  "Image understanding",
  "Custom personas & system prompts",
  "Shareable conversation links",
];

function LandingPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const go = () => {
    navigate({ to: authed ? "/chat" : "/login" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-xl bg-foreground text-background flex items-center justify-center">
            <Sparkles className="size-3.5" />
          </div>
          <span className="text-base font-semibold tracking-tight">mono</span>
        </div>
        <button
          onClick={go}
          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {authed ? "Open chat" : "Sign in"}
        </button>
      </header>

      {/* Hero */}
      <main className="px-6 pt-14 pb-20 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card text-[11px] text-muted-foreground mb-7">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Minimal AI, just for you
        </div>
        <h1 className="text-[44px] sm:text-6xl font-semibold tracking-tight leading-[1.05]">
          A quieter way<br />to talk to AI.
        </h1>
        <p className="mt-5 text-muted-foreground text-base max-w-md mx-auto">
          mono is a minimal, black & white AI chat — built like an iOS app.
          Calm by default. Fast when you need it.
        </p>

        <div className="mt-9 flex items-center justify-center gap-3">
          <button
            onClick={go}
            className="group inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full pl-6 pr-5 py-3 text-[15px] font-medium hover:opacity-90 transition-opacity"
          >
            Get started
            <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={go}
            className="text-[14px] text-muted-foreground hover:text-foreground transition-colors px-3 py-3"
          >
            Try chat →
          </button>
        </div>

        {/* Mock bubbles */}
        <div className="mt-16 mx-auto max-w-md text-left space-y-2">
          <div className="flex justify-start">
            <div className="bg-bubble-ai text-bubble-ai-foreground rounded-[20px] rounded-bl-[6px] px-3.5 py-2 text-[14px]">
              Hi! I'm mono. What's on your mind?
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-bubble-user text-bubble-user-foreground rounded-[20px] rounded-br-[6px] px-3.5 py-2 text-[14px]">
              Plan a weekend trip to Goa
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-bubble-ai text-bubble-ai-foreground rounded-[20px] rounded-bl-[6px] px-3.5 py-2 text-[14px]">
              Day 1: Baga beach + sunset at Anjuna. Day 2: Old Goa churches…
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="size-9 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <f.icon className="size-4" />
              </div>
              <h3 className="text-[14px] font-semibold">{f.title}</h3>
              <p className="text-[12.5px] text-muted-foreground mt-1 leading-snug">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Coming soon */}
      <section className="px-6 pb-24 max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-3xl p-7">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            What's next
          </p>
          <h2 className="text-2xl font-semibold tracking-tight mt-2">
            Features & updates coming soon
          </h2>
          <ul className="mt-5 grid sm:grid-cols-2 gap-y-2 gap-x-6 text-[13.5px] text-foreground/90">
            {SOON.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <span className="mt-1.5 size-1 rounded-full bg-muted-foreground shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="px-6 pb-10 text-center text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} mono
      </footer>
    </div>
  );
}
