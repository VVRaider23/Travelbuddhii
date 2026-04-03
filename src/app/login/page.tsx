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
      className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Join your trip</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sign in to continue planning
        </p>
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
          <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z" />
          <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Phone OTP */}
      {!otpSent ? (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <span className="flex items-center px-3 rounded-xl border border-gray-200 text-sm text-gray-500 bg-gray-50">
              🇮🇳 +91
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              placeholder="10-digit mobile number"
              maxLength={10}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          <button
            onClick={handleSendOtp}
            disabled={loading || phone.length < 10}
            className="w-full py-3 rounded-2xl text-white font-medium text-sm disabled:opacity-50 transition-all"
            style={{ backgroundColor: "#25D366" }}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500 text-center">
            OTP sent to +91 {phone}
          </p>
          <input
            type="number"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            onClick={handleVerifyOtp}
            disabled={loading || otp.length < 6}
            className="w-full py-3 rounded-2xl text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: "#25D366" }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            onClick={() => setOtpSent(false)}
            className="text-xs text-gray-400 text-center"
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4">
      <Suspense fallback={
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 h-80 animate-pulse" />
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
