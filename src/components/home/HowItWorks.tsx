"use client";

import { useState } from "react";

const STEPS = [
  {
    icon: "💬",
    title: "Share link on WhatsApp",
    description: "Create a trip in 30 seconds. Share the link to your group. No one needs to download an app.",
    color: "#25D366",
  },
  {
    icon: "🗳️",
    title: "Everyone votes",
    description: "Tap dates you're free. Set your budget privately. Pick your vibe. 2 minutes per person.",
    color: "#FF6B35",
  },
  {
    icon: "✨",
    title: "AI builds the plan",
    description: "Day-by-day itinerary with real places, map view, booking links to MakeMyTrip and IRCTC.",
    color: "#00A8A8",
  },
];

export function HowItWorks() {
  const [hov, setHov] = useState(-1);

  return (
    <section className="px-5 py-16" style={{ background: "#FFFFFF" }}>
      <div className="max-w-lg mx-auto">
        <h2
          className="font-playfair text-[30px] font-extrabold text-center mb-10"
          style={{ color: "var(--tb-text)" }}
        >
          How it works
        </h2>

        <div className="flex flex-col gap-4">
          {STEPS.map((step, i) => (
            <div
              key={i}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(-1)}
              className="flex gap-4 items-start p-5 rounded-[20px] transition-all duration-300 cursor-default"
              style={{
                background: hov === i ? `linear-gradient(135deg, ${step.color}06, ${step.color}10)` : "#FAFAF8",
                border: `1px solid ${hov === i ? step.color + "20" : "rgba(0,0,0,0.04)"}`,
                transform: hov === i ? "translateX(4px)" : "translateX(0)",
              }}
            >
              <div
                className="shrink-0 w-12 h-12 rounded-[14px] flex items-center justify-center text-[22px] relative"
                style={{ background: `linear-gradient(135deg, ${step.color}15, ${step.color}08)` }}
              >
                {step.icon}
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: step.color }}
                >
                  {i + 1}
                </span>
              </div>
              <div>
                <h3 className="text-[16px] font-bold mb-1" style={{ color: "var(--tb-text)" }}>
                  {step.title}
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: "var(--tb-muted)" }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
