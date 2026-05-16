import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { sendOtp, verifyOtp } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ArrowLeft, Check } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const send = useServerFn(sendOtp);
  const verify = useServerFn(verifyOtp);

  const [phone, setPhone] = useState("");
  const normalizedPhone = phone.replace(/\D/g, "");
  const displayPhone = normalizedPhone ? `+${normalizedPhone}` : "";
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/chat" });
    });
  }, [navigate]);

  const onSendOtp = async () => {
    setLoading(true);
    try {
      await send({ data: { phone } });
      toast.success("OTP sent to your WhatsApp");
      setStep("otp");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (codeOverride?: string) => {
    const code = codeOverride ?? otp;
    setLoading(true);
    try {
      const { email, password } = await verify({
        data: { phone, otp: code },
      });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setSuccess(true);
      // Brief delay so the tick animation plays
      setTimeout(() => navigate({ to: "/chat" }), 1200);
    } catch (e: any) {
      toast.error(e?.message || "Verification failed");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-5 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-semibold tracking-tight">mono</h1>
            <p className="text-muted-foreground mt-3 text-sm">
              {step === "phone"
                ? "Sign in with your number"
                : "Enter the 6-digit code"}
            </p>
          </div>

          {success ? (
            <SuccessTick />
          ) : (
            <div className="bg-card rounded-2xl p-6 space-y-4 border border-border">
              {step === "phone" ? (
                <>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={displayPhone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="+91 99999 99999"
                    className="w-full bg-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring tracking-wide"
                  />
                  <button
                    onClick={onSendOtp}
                    disabled={loading || normalizedPhone.length < 8}
                    className="w-full bg-primary text-primary-foreground font-medium rounded-xl py-3 disabled:opacity-50 transition-opacity"
                  >
                    {loading ? "Sending..." : "Send OTP via WhatsApp"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-center text-[13px] text-muted-foreground">
                    Code sent to{" "}
                    <span className="text-foreground font-medium">
                      {displayPhone}
                    </span>
                  </p>
                  <div className="flex justify-center py-2">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(v) => {
                        setOtp(v);
                        if (v.length === 6 && !loading) onVerify(v);
                      }}
                      disabled={loading}
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="size-11 rounded-xl border border-border bg-input text-lg font-semibold first:rounded-l-xl last:rounded-r-xl"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <button
                    onClick={() => onVerify()}
                    disabled={loading || otp.length < 6}
                    className="w-full bg-primary text-primary-foreground font-medium rounded-xl py-3 disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify & Sign in"}
                  </button>
                  <button
                    onClick={() => {
                      setStep("phone");
                      setOtp("");
                    }}
                    className="w-full text-sm text-muted-foreground py-1 hover:text-foreground transition-colors"
                  >
                    Change number
                  </button>
                </>
              )}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            One OTP per number every 5 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}

function SuccessTick() {
  return (
    <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
      <div className="relative">
        <div className="size-20 rounded-full bg-[#1DA1F2] flex items-center justify-center shadow-[0_0_60px_-10px_rgba(29,161,242,0.7)] animate-scale-in">
          <Check
            className="size-11 text-white"
            strokeWidth={3.5}
            style={{
              strokeDasharray: 50,
              strokeDashoffset: 50,
              animation: "draw-check 0.5s ease-out 0.2s forwards",
            }}
          />
        </div>
        <span className="absolute inset-0 rounded-full border-2 border-[#1DA1F2]/40 animate-ping" />
      </div>
      <p className="mt-5 text-[15px] font-medium">Verified</p>
      <p className="text-[12.5px] text-muted-foreground mt-1">
        Signing you in…
      </p>
      <style>{`
        @keyframes draw-check {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
