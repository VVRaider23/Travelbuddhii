"use client";

import { useState } from "react";

const FEATURES = [
  { icon: "📅", title: "Date Heatmap",       desc: "See who's free when. Real-time updates as people vote.", color: "#FF6B35" },
  { icon: "🔒", title: "Anonymous Budget",   desc: "Everyone sets their range privately. Only the overlap shows.", color: "#00A8A8" },
  { icon: "🤖", title: "AI Destinations",    desc: "3–5 suggestions filtered by budget and vibe.", color: "#8B5CF6" },
  { icon: "🗺️", title: "Map Itinerary",      desc: "Day-by-day plan with color-coded, clustered pins.", color: "#10B981" },
  { icon: "💸", title: "Expense Splitting",  desc: "Log expenses during the trip. No daily caps, no ads.", color: "#F59E0B" },
  { icon: "📱", title: "UPI Settlement",     desc: "Settle via GPay, PhonePe, or Paytm. One tap.", color: "#EC4899" },
];

export function FeatureGrid() {
  const [hov, setHov] = useState(-1);

  return (
    <section
      className="px-5 py-16"
      style={{ background: "linear-gradient(180deg, var(--tb-cream) 0%, #FFF8F0 100%)" }}
    >
      <div className="max-w-lg mx-auto">
        <h2
          className="font-playfair text-[30px] font-extrabold text-center mb-3"
          style={{ color: "var(--tb-text)" }}
        >
          Everything your<br />group needs
        </h2>
        <p className="text-center text-[15px] mb-9" style={{ color: "var(--tb-muted)" }}>
          All the tools, zero extra apps
        </p>

        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(-1)}
              className="rounded-[18px] p-5 flex flex-col gap-2 transition-all duration-300 cursor-default"
              style={{
                background: hov === i ? `linear-gradient(145deg, #fff, ${f.color}06)` : "#FFFFFF",
                border: `1px solid ${hov === i ? f.color + "25" : "rgba(0,0,0,0.04)"}`,
                boxShadow: hov === i ? `0 8px 24px ${f.color}12` : "0 2px 8px rgba(0,0,0,0.03)",
                transform: hov === i ? "translateY(-3px)" : "translateY(0)",
              }}
            >
              <div
                className="w-10 h-10 rounded-[12px] flex items-center justify-center text-xl transition-transform duration-300"
                style={{
                  background: `${f.color}10`,
                  transform: hov === i ? "scale(1.1) rotate(-4deg)" : "scale(1)",
                }}
              >
                {f.icon}
              </div>
              <h3 className="text-[14px] font-bold" style={{ color: "var(--tb-text)" }}>
                {f.title}
              </h3>
              <p className="text-[12px] leading-[1.45]" style={{ color: "var(--tb-muted)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <div
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-semibold"
            style={{
              background: "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(0,168,168,0.06))",
              border: "1px solid rgba(255,107,53,0.1)",
              color: "var(--tb-text)",
            }}
          >
            🇮🇳 Made for Indian friend groups
          </div>
        </div>
      </div>
    </section>
  );
}
