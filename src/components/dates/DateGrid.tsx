"use client";

import { motion } from "framer-motion";
import { format, eachDayOfInterval } from "date-fns";

interface Props {
  windowStart: Date;
  windowEnd: Date;
  myDates: Set<string>;
  heatmap: Record<string, number>;
  totalMembers: number;
  isAnonymous: boolean;
  pulsingDates: Set<string>;
  onToggle: (date: string) => void;
}

export function DateGrid({
  windowStart,
  windowEnd,
  myDates,
  heatmap,
  totalMembers,
  isAnonymous,
  pulsingDates,
  onToggle,
}: Props) {
  const days = eachDayOfInterval({ start: windowStart, end: windowEnd });

  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{
        display: "flex", gap: 8,
        paddingLeft: 16, paddingRight: 16,
        paddingBottom: 4,
        width: "max-content",
      }}>
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isSelected = myDates.has(dateStr);
          const isPulsing = pulsingDates.has(dateStr);
          const count = heatmap[dateStr] ?? 0;
          const dayName = format(day, "EEE").toUpperCase();
          const dayNum = format(day, "d");
          const monthName = format(day, "MMM").toUpperCase();

          return (
            <motion.button
              key={dateStr}
              onClick={() => onToggle(dateStr)}
              animate={isPulsing ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 0.2 }}
              style={{
                width: 72, flexShrink: 0,
                padding: "12px 8px 10px",
                borderRadius: 18,
                background: "#fff",
                border: `1.5px solid ${isSelected ? "var(--tb-orange)" : "rgba(0,0,0,0.07)"}`,
                boxShadow: isSelected
                  ? "0 2px 12px rgba(255,107,53,0.12)"
                  : "0 1px 4px rgba(0,0,0,0.05)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-sans)",
              }}
            >
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                color: isSelected ? "var(--tb-orange)" : "var(--tb-light)",
              }}>
                {dayName}
              </span>
              <span style={{
                fontSize: 28, fontWeight: 800, lineHeight: 1.1,
                color: isSelected ? "var(--tb-orange)" : "var(--tb-text)",
              }}>
                {dayNum}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
                color: isSelected ? "var(--tb-orange-light)" : "var(--tb-light)",
              }}>
                {monthName}
              </span>

              {/* Bottom indicator */}
              <div style={{ marginTop: 5, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isSelected ? (
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--tb-orange)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ) : (!isAnonymous && count > 0) ? (
                  <span style={{ fontSize: 10, color: "var(--tb-muted)", fontWeight: 500 }}>
                    {count}/{totalMembers}
                  </span>
                ) : (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(0,0,0,0.08)" }} />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
