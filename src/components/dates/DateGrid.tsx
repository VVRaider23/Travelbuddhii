"use client";

import { motion } from "framer-motion";
import { addDays, format, eachDayOfInterval, isSameMonth, startOfMonth, endOfMonth, getDay } from "date-fns";

interface Props {
  windowStart: Date;
  windowEnd: Date;
  myDates: Set<string>;          // dates user selected (yyyy-MM-dd)
  heatmap: Record<string, number>;  // date → count of people available
  totalMembers: number;
  isAnonymous: boolean;
  pulsingDates: Set<string>;     // dates to show pulse animation (from broadcast)
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

  function getIntensityClass(count: number): string {
    if (count === 0) return "bg-gray-100";
    const pct = count / totalMembers;
    if (pct >= 1) return "bg-green-500";
    if (pct >= 0.75) return "bg-green-400";
    if (pct >= 0.5) return "bg-amber-400";
    if (pct >= 0.25) return "bg-amber-200";
    return "bg-orange-100";
  }

  return (
    <div className="flex flex-col gap-6">
      {months.map((month) => {
        // Compute leading blank cells for day-of-week alignment
        const firstDay = month.days[0];
        const leadingBlanks = getDay(firstDay); // 0=Sun

        return (
          <div key={month.label}>
            <p className="text-sm font-semibold text-gray-600 px-4 mb-3">{month.label}</p>
            <div className="px-4 grid grid-cols-7 gap-1.5">
              {/* Day headers */}
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-center text-[10px] text-gray-400 font-medium pb-1">
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

                return (
                  <motion.button
                    key={dateStr}
                    onClick={() => onToggle(dateStr)}
                    animate={isPulsing ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.2 }}
                    className={`
                      relative aspect-square rounded-xl flex flex-col items-center justify-center
                      min-h-[44px] text-xs font-medium transition-all active:scale-95
                      ${isSelected
                        ? "ring-2 ring-green-500 ring-offset-1"
                        : "ring-0"
                      }
                      ${count > 0 && !isSelected ? getIntensityClass(count) : ""}
                      ${isSelected ? "bg-green-500 text-white" : count === 0 ? "bg-gray-100 text-gray-700" : "text-gray-800"}
                    `}
                  >
                    <span>{format(day, "d")}</span>
                    {!isAnonymous && count > 0 && (
                      <span className={`text-[9px] mt-0.5 ${isSelected ? "text-green-100" : "text-gray-500"}`}>
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
