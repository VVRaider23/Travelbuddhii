"use client";

import { useState, useEffect } from "react";

const MESSAGES = [
  { text: "Bro when are we going to Goa??", side: "left", name: "Rahul" },
  { text: "I can't do that weekend yaar", side: "right", name: "Priya" },
  { text: "What's the budget? 15k? 30k?", side: "left", name: "Amit" },
  { text: "Just make a Google Form na", side: "right", name: "Sneha" },
];

const NAME_COLORS = ["#1FA855", "#D4436A", "#6B72E0", "#D4832A"];

interface Props {
  onGone?: () => void;
}

export function WhatsAppChaos({ onGone }: Props) {
  const [msgs, setMsgs] = useState<typeof MESSAGES>([]);
  const [phase, setPhase] = useState<"chat" | "dissolve" | "gone">("chat");

  useEffect(() => {
    // Messages appear one by one: 400ms, 1000ms, 1600ms, 2200ms
    MESSAGES.forEach((msg, i) => {
      setTimeout(() => setMsgs((prev) => [...prev, msg]), 400 + i * 600);
    });

    // Last message at 2200ms, hold for 600ms, then dissolve
    const dissolveAt = 400 + MESSAGES.length * 600 + 600; // ~3400ms
    const goneAt = dissolveAt + 700;                       // ~4100ms

    const t1 = setTimeout(() => setPhase("dissolve"), dissolveAt);
    const t2 = setTimeout(() => {
      setPhase("gone");
      onGone?.();
    }, goneAt);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className="flex flex-col items-center w-full"
      style={{
        padding: "0 8px",
        opacity: phase === "dissolve" ? 0 : 1,
        transform: phase === "dissolve" ? "translateY(-24px) scale(0.93)" : "translateY(0) scale(1)",
        transition: "opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* WA header */}
      <div
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5"
        style={{ maxWidth: 320, background: "#075E54", borderRadius: "14px 14px 0 0" }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold text-white shrink-0"
          style={{ background: "#128C7E" }}
        >
          GG
        </div>
        <div>
          <div className="text-[12.5px] font-semibold text-white">Goa Gang 🏖️</div>
          <div className="text-[9.5px]" style={{ color: "rgba(255,255,255,0.55)" }}>6 members</div>
        </div>
      </div>

      {/* Chat body */}
      <div
        className="w-full flex flex-col gap-1 p-2.5"
        style={{
          maxWidth: 320,
          background: "#ECE5DD",
          borderRadius: "0 0 14px 14px",
          minHeight: 80,
        }}
      >
        {msgs.map((msg, i) => (
          <div
            key={i}
            className="flex animate-fadeUp"
            style={{ justifyContent: msg.side === "right" ? "flex-end" : "flex-start" }}
          >
            <div
              className="max-w-[78%] px-2.5 py-1"
              style={{
                background: msg.side === "right" ? "#DCF8C6" : "#FFFFFF",
                borderRadius: msg.side === "right" ? "10px 2px 10px 10px" : "2px 10px 10px 10px",
                boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
              }}
            >
              {msg.side === "left" && (
                <div className="text-[10.5px] font-semibold mb-0.5" style={{ color: NAME_COLORS[i % 4] }}>
                  {msg.name}
                </div>
              )}
              <div className="text-[12px] leading-snug" style={{ color: "#303030" }}>
                {msg.text}
              </div>
              <div className="text-[9.5px] text-right mt-0.5" style={{ color: "#8696A0" }}>
                {`${9 + Math.floor(i / 2)}:${(15 + i * 3).toString().padStart(2, "0")} PM`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
