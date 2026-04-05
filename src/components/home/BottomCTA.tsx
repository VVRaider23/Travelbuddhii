"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

export function BottomCTA() {
  const [tripName, setTripName] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const ph = usePlaceholderCycle(true);
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
        padding: "64px 20px 80px",
        background: "linear-gradient(180deg, #FFF8F0 0%, var(--tb-cream) 30%, #FFECD9 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Floating orb */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: -80,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)",
          animation: "float 8s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          maxWidth: 420,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          textAlign: "center",
        }}
      >
        {/* Heading */}
        <h2
          className="font-playfair"
          style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.15, color: "var(--tb-text)" }}
        >
          Your next trip is<br />
          <span style={{ color: "var(--tb-orange)" }}>one link away</span>
        </h2>

        {/* Subtitle */}
        <p style={{ fontSize: 15, color: "var(--tb-muted)", margin: 0 }}>
          Stop planning in WhatsApp chaos. Start in 30 seconds. Free forever.
        </p>

        {/* Input + CTA */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
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
        </div>

        {/* Footer line */}
        <p style={{ fontSize: 13, color: "var(--tb-light)", margin: 0 }}>
          Free forever · No sign-up needed · ₹0
        </p>
      </div>
    </section>
  );
}
