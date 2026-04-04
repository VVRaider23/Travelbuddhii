"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
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

function usePlaceholderCycle() {
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(true);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start cycling after chaos animation ends (~4s)
  useRef(() => {
    const start = setTimeout(() => {
      ref.current = setInterval(() => {
        setVis(false);
        setTimeout(() => {
          setIdx((p) => (p + 1) % PLACEHOLDER_EXAMPLES.length);
          setVis(true);
        }, 300);
      }, 2800);
    }, 4200);
    return () => {
      clearTimeout(start);
      if (ref.current) clearInterval(ref.current);
    };
  });

  return { idx, vis };
}

const TRUST = [
  { icon: "💳", text: "No payment needed" },
  { icon: "📱", text: "Works on any phone" },
  { icon: "⚡", text: "30 sec to start" },
];

export function HeroSection() {
  const [tripName, setTripName] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const ph = usePlaceholderCycle();
  const showPh = !tripName && !focused;

  async function handleCreate() {
    if (!tripName.trim()) {
      inputRef.current?.focus();
      return;
    }

    setLoading(true);

    // Check auth state
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Preserve trip name across OAuth redirect
      sessionStorage.setItem("pending_trip_name", tripName.trim());
      router.push(`/login?redirect=/trips/new`);
      return;
    }

    // Already authed — go straight to create
    sessionStorage.setItem("pending_trip_name", tripName.trim());
    router.push("/trips/new");
  }

  return (
    <section
      className="relative flex flex-col items-center justify-center min-h-screen px-5 overflow-hidden"
      style={{
        background: "linear-gradient(165deg, var(--tb-cream) 0%, #FFF5E8 35%, #FFECD9 65%, var(--tb-sand) 100%)",
        paddingBottom: "3rem",
        paddingTop: "2rem",
      }}
    >
      {/* Floating orbs */}
      <div
        className="absolute pointer-events-none animate-float"
        style={{ top: -60, right: -40, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)" }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ bottom: "10%", left: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,168,168,0.12) 0%, transparent 70%)", animation: "float 10s ease-in-out infinite" }}
      />
      <div
        className="absolute pointer-events-none animate-float"
        style={{ top: "30%", left: "15%", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,143,94,0.1) 0%, transparent 70%)", animationDelay: "2s" }}
      />
      {/* Dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 20px 20px, rgba(255,107,53,0.03) 2px, transparent 2px)", backgroundSize: "40px 40px" }}
      />

      <div
        className="relative z-10 flex flex-col items-center gap-4 text-center w-full"
        style={{ maxWidth: 420 }}
      >
        {/* WhatsApp chaos animation */}
        <WhatsAppChaos />

        {/* Brand wordmark */}
        <div className="flex items-center gap-2 animate-fadeUp" style={{ animationDelay: "4.2s" }}>
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))",
              boxShadow: "0 3px 12px rgba(255,107,53,0.3)",
            }}
          >
            <span className="font-playfair text-lg font-black text-white">T</span>
          </div>
          <span className="text-[22px] font-bold" style={{ color: "var(--tb-text)", letterSpacing: "-0.01em" }}>
            travel<span style={{ color: "var(--tb-orange)" }}>buddhii</span>
          </span>
        </div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium animate-fadeUp"
          style={{
            background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.15)",
            color: "var(--tb-orange)", letterSpacing: "0.02em", animationDelay: "4.4s",
          }}
        >
          <span>✨</span> AI-powered trip planning
        </div>

        {/* Headline */}
        <div className="animate-fadeUp" style={{ animationDelay: "4.5s" }}>
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
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-2 text-sm animate-fadeIn" style={{ color: "var(--tb-muted)", animationDelay: "4.7s" }}>
          <span className="w-2 h-2 rounded-full animate-pulseDot" style={{ background: "#10B981" }} />
          <span>
            <strong style={{ color: "var(--tb-text)" }}>2,347+</strong> trips planned
          </span>
        </div>

        {/* Product demo */}
        <div className="w-full animate-scaleIn" style={{ animationDelay: "4.8s" }}>
          <ProductDemo />
        </div>

        {/* Input + CTA */}
        <div className="w-full flex flex-col gap-3 animate-fadeUp" style={{ animationDelay: "5s" }}>
          <div
            className="relative rounded-[18px] overflow-hidden transition-all duration-300"
            style={{
              background: "#fff",
              border: `2px solid ${focused ? "var(--tb-orange)" : "rgba(0,0,0,0.06)"}`,
              boxShadow: focused
                ? "0 0 0 4px rgba(255,107,53,0.1), 0 4px 20px rgba(0,0,0,0.06)"
                : "0 2px 12px rgba(0,0,0,0.04)",
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
              <div
                className="absolute inset-0 flex items-center pointer-events-none z-[1] px-5"
              >
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
              boxShadow: "0 4px 16px rgba(37,211,102,0.25)",
              fontFamily: "var(--font-sans)",
              letterSpacing: "0.01em",
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {loading ? "Just a moment..." : "Create & Share on WhatsApp"}
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
        </div>
      </div>
    </section>
  );
}
