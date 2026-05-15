import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { sendOtp, verifyOtp } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
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

  const onVerify = async () => {
    setLoading(true);
    try {
      const { email, password } = await verify({ data: { phone, otp } });
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Signed in");
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-semibold tracking-tight">mono</h1>
          <p className="text-muted-foreground mt-3 text-sm">
            Minimal AI, just for you.
          </p>
        </div>

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
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
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
              <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                Enter OTP sent to {phone}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full bg-input rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={onVerify}
                disabled={loading || otp.length < 4}
                className="w-full bg-primary text-primary-foreground font-medium rounded-xl py-3 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Sign in"}
              </button>
              <button
                onClick={() => setStep("phone")}
                className="w-full text-sm text-muted-foreground py-2"
              >
                Change number
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          One OTP per number every 5 minutes.
        </p>
      </div>
    </div>
  );
}
