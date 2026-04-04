"use client";

import { motion } from "framer-motion";
import { format, eachDayOfInterval, getDay } from "date-fns";

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

  // Group by month
  const months: { label: string; days: Date[] }[] = [];
  let currentMonth = "";
  for (const day of days) {
    const monthKey = format(day, "yyyy-MM");
    if (monthKey !== currentMonth) {
      currentMonth = monthKey;
      months.push({ label: format(day, "MMMM yyyy"), days: [] });
    }
    months[months.length - 1].days.push(day);
  }

  function getHeatmapStyle(count: number, isSelected: boolean): React.CSSProperties {
    if (isSelected) {
      return {
        background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))",
        color: "#fff",
        fontWeight: 700,
        boxShadow: "0 2px 8px rgba(255,107,53,0.3)",
      };
    }
    if (count === 0) return { background: "rgba(0,0,0,0.025)", color: "var(--tb-muted)" };
    const pct = count / totalMembers;
    if (pct >= 1) return { background: "rgba(37,211,102,0.85)", color: "#fff" };
    if (pct >= 0.75) return { background: "rgba(37,211,102,0.6)", color: "var(--tb-text)" };
    if (pct >= 0.5) return { background: "rgba(255,193,7,0.55)", color: "var(--tb-text)" };
    if (pct >= 0.25) return { background: "rgba(255,107,53,0.25)", color: "var(--tb-text)" };
    return { background: "rgba(255,107,53,0.1)", color: "var(--tb-muted)" };
  }

  return (
    <div className="flex flex-col gap-6">
      {months.map((month) => {
        const firstDay = month.days[0];
        const leadingBlanks = getDay(firstDay);

        return (
          <div key={month.label} className="px-4">
            <p
              className="text-[13px] font-semibold mb-3"
              style={{ color: "var(--tb-text)" }}
            >
              {month.label}
            </p>

            <div className="grid grid-cols-7 gap-1.5">
              {/* Day headers */}
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] font-semibold uppercase tracking-wider pb-1"
                  style={{ color: "var(--tb-light)" }}
                >
                  {d}
                </div>
              ))}

              {/* Leading blanks */}
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}

              {/* Date cells */}
              {month.days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const count = heatmap[dateStr] ?? 0;
                const isSelected = myDates.has(dateStr);
                const isPulsing = pulsingDates.has(dateStr);
                const cellStyle = getHeatmapStyle(count, isSelected);

                return (
                  <motion.button
                    key={dateStr}
                    onClick={() => onToggle(dateStr)}
                    animate={isPulsing ? { scale: [1, 1.18, 1] } : {}}
                    transition={{ duration: 0.2 }}
                    className="relative aspect-square rounded-[12px] flex flex-col items-center justify-center min-h-[44px] text-[13px] transition-all active:scale-95"
                    style={cellStyle}
                  >
                    <span className="font-medium">{format(day, "d")}</span>
                    {!isAnonymous && count > 0 && (
                      <span
                        className="text-[9px] mt-0.5"
                        style={{ opacity: isSelected ? 0.7 : 0.65 }}
                      >
                        {count}/{totalMembers}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
