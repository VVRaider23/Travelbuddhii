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

    // Last message at 2200ms, hold for 1800ms, then dissolve
    const dissolveAt = 400 + MESSAGES.length * 600 + 1800; // ~4000ms
    const goneAt = dissolveAt + 700;                        // ~4700ms

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
      style={{
        padding: "0 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: phase === "dissolve" ? 0 : 1,
        transform: phase === "dissolve" ? "translateY(-24px) scale(0.93)" : "translateY(0) scale(1)",
        transition: "opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* WA header */}
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          background: "#075E54",
          borderRadius: "14px 14px 0 0",
          padding: "9px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#128C7E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            color: "white",
            flexShrink: 0,
          }}
        >
          GG
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Goa Gang 🏖️</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>6 members</div>
        </div>
      </div>

      {/* Chat body */}
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          background: "#ECE5DD",
          borderRadius: "0 0 14px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: 12,
          minHeight: 80,
        }}
      >
        {msgs.map((msg, i) => (
          <div
            key={i}
            className="animate-fadeUp"
            style={{ display: "flex", justifyContent: msg.side === "right" ? "flex-end" : "flex-start" }}
          >
            <div
              style={{
                maxWidth: "78%",
                padding: "4px 10px",
                background: msg.side === "right" ? "#DCF8C6" : "#FFFFFF",
                borderRadius: msg.side === "right" ? "10px 2px 10px 10px" : "2px 10px 10px 10px",
                boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
              }}
            >
              {msg.side === "left" && (
                <div style={{ fontSize: 10.5, fontWeight: 600, marginBottom: 2, color: NAME_COLORS[i % 4] }}>
                  {msg.name}
                </div>
              )}
              <div style={{ fontSize: 12, lineHeight: "1.4", color: "#303030" }}>
                {msg.text}
              </div>
              <div style={{ fontSize: 9.5, textAlign: "right", marginTop: 2, color: "#8696A0" }}>
                {`${9 + Math.floor(i / 2)}:${(15 + i * 3).toString().padStart(2, "0")} PM`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
