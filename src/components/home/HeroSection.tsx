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

const SOCIAL_GROUPS = [
  { name: "Rahul's group", dest: "Goa" },
  { name: "Sneha's squad", dest: "Manali" },
  { name: "Arjun & friends", dest: "Pondicherry" },
  { name: "Kavya's crew", dest: "Udaipur" },
];

const AVATAR_COLORS = ["#FF6B35", "#00A8A8", "#8B5CF6"];

function SocialProof() {
  const [count, setCount] = useState(2347);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);

  useEffect(() => {
    function scheduleNext() {
      const delay = 8000 + Math.random() * 12000;
      return setTimeout(() => {
        setCount((c) => c + 1);
        scheduleNext();
      }, delay);
    }
    const t = scheduleNext();
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIdx((i) => (i + 1) % SOCIAL_GROUPS.length);
        setTickerVisible(true);
      }, 300);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const trip = SOCIAL_GROUPS[tickerIdx];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {/* Live count row */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6, fontSize: 13, color: "var(--tb-muted)" }}>
        <span
          className="animate-pulseDot"
          style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block", flexShrink: 0 }}
        />
        <span>{count.toLocaleString()}+ trips planned</span>
      </div>

      {/* Ticker row */}
      <div style={{ height: 26, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 12px",
            borderRadius: 100,
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.1)",
            fontSize: 11.5,
            color: "var(--tb-muted)",
            opacity: tickerVisible ? 1 : 0,
            transform: tickerVisible ? "translateY(0)" : "translateY(-8px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          {/* Stacked avatars */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {AVATAR_COLORS.map((color, j) => (
              <div
                key={j}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: color,
                  border: "1.5px solid white",
                  marginLeft: j > 0 ? -5 : 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {trip.name[0]}
              </div>
            ))}
          </div>
          <span>{trip.name} planned {trip.dest}</span>
        </div>
      </div>
    </div>
  );
}

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
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        overflow: "hidden",
        background: "linear-gradient(165deg, var(--tb-cream) 0%, #FFF5E8 35%, #FFECD9 65%, var(--tb-sand) 100%)",
        padding: "2rem 1.25rem 3rem",
      }}
    >
      {/* Floating orbs */}
      <div className="absolute pointer-events-none animate-float" style={{ top: -60, right: -40, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "10%", left: -80, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,168,168,0.14) 0%, transparent 70%)", animation: "float 10s ease-in-out infinite" }} />
      <div className="absolute pointer-events-none animate-float" style={{ top: "35%", left: "8%", width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,143,94,0.1) 0%, transparent 70%)", animationDelay: "2s" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20px 20px, rgba(255,107,53,0.03) 2px, transparent 2px)", backgroundSize: "40px 40px" }} />

      {/* Content container — no phone frame */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          textAlign: "center",
          maxWidth: 420,
          width: "100%",
        }}
      >
        {/* Phase 1: WhatsApp chaos */}
        <AnimatePresence>
          {!chaosGone && (
            <motion.div
              key="chaos"
              style={{ width: "100%", padding: "0 8px" }}
              exit={{ opacity: 0, y: -20, scale: 0.94, transition: { duration: 0.5 } }}
            >
              <WhatsAppChaos onGone={() => setChaosGone(true)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 2: Hero content */}
        <AnimatePresence>
          {chaosGone && (
            <motion.div
              key="hero"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}
              variants={container}
              initial="hidden"
              animate="show"
            >
              {/* Brand wordmark */}
              <motion.div variants={item} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))",
                    boxShadow: "0 3px 12px rgba(255,107,53,0.3)",
                  }}
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
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 16px",
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 500,
                  background: "rgba(255,107,53,0.08)",
                  border: "1px solid rgba(255,107,53,0.15)",
                  color: "var(--tb-orange)",
                  letterSpacing: "0.02em",
                }}
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

              {/* Social proof — full component */}
              <motion.div variants={item}>
                <SocialProof />
              </motion.div>

              {/* Product demo */}
              <motion.div variants={item} style={{ width: "100%", padding: "0 8px" }}>
                <ProductDemo />
              </motion.div>

              {/* Input + CTA */}
              <motion.div variants={item} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{
                    position: "relative",
                    borderRadius: 18,
                    overflow: "hidden",
                    background: "#fff",
                    border: `2px solid ${focused ? "var(--tb-orange)" : "rgba(0,0,0,0.06)"}`,
                    boxShadow: focused ? "0 0 0 4px rgba(255,107,53,0.1), 0 4px 20px rgba(0,0,0,0.06)" : "0 2px 12px rgba(0,0,0,0.04)",
                    transition: "all 0.3s ease",
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
                    background: "linear-gradient(135deg, #25D366 0%, #2EE07A 100%)",
                    boxShadow: "0 4px 16px rgba(37,211,102,0.3)",
                    fontFamily: "var(--font-sans)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {loading ? (
                    "Just a moment..."
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.107 1.523 5.832L.057 23.887a.75.75 0 00.916.944l6.204-1.623A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.704 9.704 0 01-4.94-1.349l-.355-.21-3.68.964.982-3.589-.23-.369A9.71 9.71 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                      </svg>
                      Create &amp; Share on WhatsApp
                    </>
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
