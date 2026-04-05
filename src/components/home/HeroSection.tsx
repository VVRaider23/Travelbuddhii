"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ProductDemo } from "./ProductDemo";
import { WhatsAppChaos } from "./WhatsAppChaos";

const PLACEHOLDER_EXAMPLES = [
  "Class 10th Reunion Trip 🎓",
  "Goa with the boys 🍺",
  "Family Manali Vacation ⛰️",
  "College Gang Pondicherry 🏖️",
  "Office Team Outing 🎉",
  "Besties Udaipur Trip 💕",
];

function usePlaceholderCycle(enabled: boolean) {
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => {
      setVis(false);
      setTimeout(() => {
        setIdx((p) => (p + 1) % PLACEHOLDER_EXAMPLES.length);
        setVis(true);
      }, 300);
    }, 2800);
    return () => clearInterval(t);
  }, [enabled]);

  return { idx, vis };
}

const TRUST = [
  { icon: "💳", text: "No payment needed" },
  { icon: "📱", text: "Works on any phone" },
  { icon: "⚡", text: "30 sec to start" },
];

// Stagger variants for hero items
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
};

export function HeroSection() {
  const [chaosGone, setChaosGone] = useState(false);
  const [tripName, setTripName] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const ph = usePlaceholderCycle(chaosGone);
  const showPh = !tripName && !focused;

  async function handleCreate() {
    if (!tripName.trim()) {
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      sessionStorage.setItem("pending_trip_name", tripName.trim());
      router.push(`/login?redirect=/trips/new`);
      return;
    }
    sessionStorage.setItem("pending_trip_name", tripName.trim());
    router.push("/trips/new");
  }

  return (
    <section
      className="relative flex items-start justify-center min-h-screen overflow-hidden"
      style={{
        background: "linear-gradient(165deg, var(--tb-cream) 0%, #FFF5E8 35%, #FFECD9 65%, var(--tb-sand) 100%)",
        padding: "40px 20px 60px",
      }}
    >
      {/* Floating orbs — behind the phone frame */}
      <div className="absolute pointer-events-none animate-float" style={{ top: -60, right: -40, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "10%", left: -80, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,168,168,0.14) 0%, transparent 70%)", animation: "float 10s ease-in-out infinite" }} />
      <div className="absolute pointer-events-none animate-float" style={{ top: "35%", left: "8%", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,143,94,0.1) 0%, transparent 70%)", animationDelay: "2s" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20px 20px, rgba(255,107,53,0.03) 2px, transparent 2px)", backgroundSize: "40px 40px" }} />

      {/* Phone frame */}
      <div
        className="relative z-10 w-full flex flex-col items-center gap-4 text-center"
        style={{
          maxWidth: 420,
          borderRadius: 36,
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.10), 0 4px 20px rgba(0,0,0,0.05)",
          overflow: "hidden",
          padding: "0 0 24px",
        }}
      >

        {/* Phase 1: WhatsApp chaos — shows first, then fades out */}
        <AnimatePresence>
          {!chaosGone && (
            <motion.div
              key="chaos"
              className="w-full"
              exit={{ opacity: 0, y: -20, scale: 0.94, transition: { duration: 0.5 } }}
            >
              <WhatsAppChaos onGone={() => setChaosGone(true)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 2: Hero content — only appears after chaos is gone */}
        <AnimatePresence>
          {chaosGone && (
            <motion.div
              key="hero"
              className="flex flex-col items-center gap-4 w-full px-5"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {/* Brand wordmark */}
              <motion.div variants={item} className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))", boxShadow: "0 3px 12px rgba(255,107,53,0.3)" }}
                >
                  <span className="font-playfair text-lg font-black text-white">T</span>
                </div>
                <span className="text-[22px] font-bold" style={{ color: "var(--tb-text)", letterSpacing: "-0.01em" }}>
                  travel<span style={{ color: "var(--tb-orange)" }}>buddhii</span>
                </span>
              </motion.div>

              {/* Badge */}
              <motion.div
                variants={item}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium"
                style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.15)", color: "var(--tb-orange)", letterSpacing: "0.02em" }}
              >
                <span>✨</span> AI-powered trip planning
              </motion.div>

              {/* Headline */}
              <motion.div variants={item}>
                <h1
                  className="font-playfair leading-[1.1] tracking-tight"
                  style={{ fontSize: "clamp(36px,9vw,46px)", fontWeight: 800, color: "var(--tb-text)" }}
                >
                  Plan your next<br />group trip{" "}
                  <span style={{ color: "var(--tb-orange)", position: "relative", display: "inline-block" }}>
                    without<br />the chaos
                    <svg viewBox="0 0 200 12" style={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: 12 }}>
                      <path d="M5 8 Q50 2 100 7 Q150 12 195 5" stroke="var(--tb-orange)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />
                    </svg>
                  </span>
                </h1>
                <p className="mt-3 text-[17px] leading-relaxed" style={{ color: "var(--tb-muted)" }}>
                  One link. Everyone votes. You go.
                </p>
              </motion.div>

              {/* Social proof */}
              <motion.div variants={item} className="flex items-center gap-2 text-sm" style={{ color: "var(--tb-muted)" }}>
                <span className="w-2 h-2 rounded-full animate-pulseDot" style={{ background: "#10B981" }} />
                <span><strong style={{ color: "var(--tb-text)" }}>2,347+</strong> trips planned</span>
              </motion.div>

              {/* Product demo */}
              <motion.div variants={item} className="w-full">
                <ProductDemo />
              </motion.div>

              {/* Input + CTA */}
              <motion.div variants={item} className="w-full flex flex-col gap-3">
                <div
                  className="relative rounded-[18px] overflow-hidden transition-all duration-300"
                  style={{
                    background: "#fff",
                    border: `2px solid ${focused ? "var(--tb-orange)" : "rgba(0,0,0,0.06)"}`,
                    boxShadow: focused ? "0 0 0 4px rgba(255,107,53,0.1), 0 4px 20px rgba(0,0,0,0.06)" : "0 2px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={focused ? "Type your trip name..." : ""}
                    className="w-full text-[16px] font-medium relative z-[2] bg-transparent outline-none"
                    style={{ padding: "18px 20px", color: "var(--tb-text)", fontFamily: "var(--font-sans)" }}
                    autoComplete="off"
                  />
                  {showPh && (
                    <div className="absolute inset-0 flex items-center pointer-events-none z-[1] px-5">
                      <span className="text-[15px]" style={{ color: "#B0A89E" }}>Give your trip a name </span>
                      <span className="text-[15px] mx-1" style={{ color: "#CCC4BA" }}>(</span>
                      <span
                        key={ph.idx}
                        className="text-[14px] font-medium italic max-w-[155px] overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{
                          color: "var(--tb-orange)",
                          opacity: ph.vis ? 1 : 0,
                          transform: ph.vis ? "translateY(0)" : "translateY(-6px)",
                          transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      >
                        {PLACEHOLDER_EXAMPLES[ph.idx]}
                      </span>
                      <span className="text-[15px]" style={{ color: "#CCC4BA" }}>)</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="relative w-full flex items-center justify-center gap-2.5 text-white font-bold text-[17px] rounded-[18px] transition-all hover:-translate-y-0.5 hover:scale-[1.01] disabled:opacity-60"
                  style={{
                    padding: "18px 24px",
                    background: "linear-gradient(135deg, var(--tb-orange) 0%, var(--tb-orange-light) 100%)",
                    boxShadow: "0 4px 16px rgba(255,107,53,0.3)",
                    fontFamily: "var(--font-sans)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {loading ? "Just a moment..." : "Create Trip"}
                  {!loading && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  )}
                </button>

                {/* Trust signals */}
                <div className="flex justify-center gap-2 flex-wrap">
                  {TRUST.map((s) => (
                    <span
                      key={s.text}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded-full"
                      style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.04)", color: "var(--tb-muted)" }}
                    >
                      <span className="text-[11px]">{s.icon}</span>{s.text}
                    </span>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
