"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(redirect);
    });
  }, [redirect, router]);

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });
  }

  async function handleSendOtp() {
    if (!phone.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone.startsWith("+") ? phone : `+91${phone}`,
    });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      setOtpSent(true);
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone: phone.startsWith("+") ? phone : `+91${phone}`,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      router.replace(redirect);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full max-w-sm flex flex-col gap-6 rounded-[28px] p-8"
      style={{
        background: "rgba(255,255,255,0.97)",
        border: "1px solid rgba(0,0,0,0.04)",
        boxShadow: "0 16px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      {/* Logo + title */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))",
            boxShadow: "0 4px 14px rgba(255,107,53,0.3)",
          }}
        >
          <span className="font-playfair text-[20px] font-black text-white">T</span>
        </div>
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--tb-text)" }}>
            Join your trip
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--tb-light)" }}>
            Sign in to continue planning
          </p>
        </div>
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-[16px] font-semibold text-[15px] transition-all hover:-translate-y-0.5 disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))",
          color: "#fff",
          boxShadow: "0 3px 12px rgba(255,107,53,0.25)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="white" fillOpacity="0.9" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
          <path fill="white" fillOpacity="0.9" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
          <path fill="white" fillOpacity="0.9" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z" />
          <path fill="white" fillOpacity="0.9" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.06)" }} />
        <span className="text-[12px]" style={{ color: "var(--tb-light)" }}>or</span>
        <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.06)" }} />
      </div>

      {/* Phone OTP */}
      {!otpSent ? (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <span
              className="flex items-center px-3 rounded-[12px] text-[13px] font-medium shrink-0"
              style={{
                background: "rgba(0,0,0,0.025)",
                border: "1px solid rgba(0,0,0,0.06)",
                color: "var(--tb-muted)",
              }}
            >
              🇮🇳 +91
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              placeholder="10-digit mobile number"
              maxLength={10}
              className="flex-1 px-4 py-3 rounded-[12px] text-[14px] outline-none transition-all"
              style={{
                background: "rgba(0,0,0,0.02)",
                border: "2px solid rgba(0,0,0,0.06)",
                color: "var(--tb-text)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--tb-orange)";
                e.target.style.boxShadow = "0 0 0 3px rgba(255,107,53,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(0,0,0,0.06)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
          <button
            onClick={handleSendOtp}
            disabled={loading || phone.length < 10}
            className="w-full py-3.5 rounded-[16px] text-white font-semibold text-[14px] disabled:opacity-50 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
            style={{
              background: "linear-gradient(135deg, #25D366 0%, #2EE07A 100%)",
              boxShadow: "0 3px 12px rgba(37,211,102,0.25)",
            }}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-center" style={{ color: "var(--tb-muted)" }}>
            OTP sent to +91 {phone}
          </p>
          <input
            type="number"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            className="w-full px-4 py-3 rounded-[12px] text-center text-[20px] font-mono tracking-widest outline-none transition-all"
            style={{
              background: "rgba(0,0,0,0.02)",
              border: "2px solid rgba(0,0,0,0.06)",
              color: "var(--tb-text)",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--tb-orange)";
              e.target.style.boxShadow = "0 0 0 3px rgba(255,107,53,0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(0,0,0,0.06)";
              e.target.style.boxShadow = "none";
            }}
          />
          <button
            onClick={handleVerifyOtp}
            disabled={loading || otp.length < 6}
            className="w-full py-3.5 rounded-[16px] text-white font-semibold text-[14px] disabled:opacity-50 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
            style={{
              background: "linear-gradient(135deg, var(--tb-orange) 0%, var(--tb-orange-light) 100%)",
              boxShadow: "0 3px 12px rgba(255,107,53,0.25)",
            }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            onClick={() => setOtpSent(false)}
            className="text-[12px] text-center transition-opacity hover:opacity-70"
            style={{ color: "var(--tb-light)" }}
          >
            Change number
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(165deg, var(--tb-cream) 0%, #FFF5E8 40%, var(--tb-sand) 100%)",
      }}
    >
      {/* Orbs */}
      <div
        className="absolute pointer-events-none animate-float"
        style={{ top: -40, right: -30, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)" }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ bottom: "10%", left: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,168,168,0.12) 0%, transparent 70%)", animation: "float 10s ease-in-out infinite" }}
      />

      <Suspense fallback={
        <div
          className="w-full max-w-sm rounded-[28px] h-80 animate-shimmer"
          style={{ background: "rgba(255,255,255,0.8)" }}
        />
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
