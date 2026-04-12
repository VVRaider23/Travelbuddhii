"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  isBefore,
  isSameDay,
  isAfter,
  startOfDay,
} from "date-fns";

interface SetDateWindowProps {
  slug: string;
  isOrganizer: boolean;
  onSet: (start: string, end: string) => void;
}

export function SetDateWindow({ slug, isOrganizer, onSet }: SetDateWindowProps) {
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const today = startOfDay(new Date());

  function handleDayClick(day: Date) {
    if (isBefore(day, today)) return;

    if (!start || (start && end)) {
      setStart(day);
      setEnd(null);
    } else {
      if (isBefore(day, start)) {
        setEnd(start);
        setStart(day);
      } else if (isSameDay(day, start)) {
        setStart(null);
      } else {
        setEnd(day);
      }
    }
  }

  async function handleSave() {
    if (!start || !end) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/trips/${slug}/dates/window`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_window_start: format(start, "yyyy-MM-dd"),
          date_window_end: format(end, "yyyy-MM-dd"),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Could not save dates");
        setSaving(false);
        return;
      }
      toast.success("Date window set!");
      onSet(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
    } catch {
      toast.error("Something went wrong");
      setSaving(false);
    }
  }

  // — Member view —
  if (!isOrganizer) {
    return (
      <div style={{
        padding: "40px 24px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 16, textAlign: "center",
      }}>
        <span style={{ fontSize: 48 }}>📅</span>
        <h2 style={{
          fontFamily: "var(--font-playfair)",
          fontSize: 20, fontWeight: 700, color: "var(--tb-text)",
        }}>
          Waiting for dates
        </h2>
        <p style={{ fontSize: 14, color: "var(--tb-muted)", maxWidth: 280, lineHeight: 1.5 }}>
          The organizer hasn&apos;t set a date window yet. Once they do, you&apos;ll be able to vote on your availability here.
        </p>
        <div style={{
          marginTop: 8, padding: "10px 20px", borderRadius: 14,
          background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)",
          fontSize: 13, color: "var(--tb-light)",
        }}>
          Check back soon or nudge them!
        </div>
      </div>
    );
  }

  // — Organizer view: inline calendar —
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart); // 0=Sun

  const nextMonth = addMonths(currentMonth, 1);
  const nextMonthStart = startOfMonth(nextMonth);
  const nextMonthEnd = endOfMonth(nextMonth);
  const nextDays = eachDayOfInterval({ start: nextMonthStart, end: nextMonthEnd });
  const nextStartPadding = getDay(nextMonthStart);

  function isInRange(day: Date) {
    if (!start || !end) return false;
    return isAfter(day, start) && isBefore(day, end);
  }

  function isSelected(day: Date) {
    if (start && isSameDay(day, start)) return true;
    if (end && isSameDay(day, end)) return true;
    return false;
  }

  function renderMonth(monthDays: Date[], padding: number, label: string) {
    return (
      <div>
        <div style={{
          textAlign: "center", fontSize: 14, fontWeight: 700,
          color: "var(--tb-text)", marginBottom: 10,
        }}>
          {label}
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4,
          textAlign: "center",
        }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} style={{ fontSize: 11, fontWeight: 600, color: "var(--tb-light)", padding: "4px 0" }}>
              {d}
            </div>
          ))}
          {Array.from({ length: padding }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {monthDays.map((day) => {
            const isPast = isBefore(day, today);
            const selected = isSelected(day);
            const inRange = isInRange(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                disabled={isPast}
                style={{
                  width: "100%", aspectRatio: "1", borderRadius: selected ? 12 : 8,
                  border: "none", cursor: isPast ? "default" : "pointer",
                  fontSize: 14, fontWeight: selected ? 700 : 500,
                  fontFamily: "var(--font-sans)",
                  background: selected
                    ? "linear-gradient(135deg, var(--tb-orange) 0%, var(--tb-orange-light) 100%)"
                    : inRange
                      ? "rgba(255,107,53,0.12)"
                      : "transparent",
                  color: selected
                    ? "#fff"
                    : isPast
                      ? "rgba(0,0,0,0.15)"
                      : inRange
                        ? "var(--tb-orange)"
                        : "var(--tb-text)",
                  transition: "all 0.15s ease",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: "24px 16px",
      display: "flex", flexDirection: "column", gap: 20,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 40 }}>📅</span>
        <h2 style={{
          fontFamily: "var(--font-playfair)",
          fontSize: 20, fontWeight: 700, color: "var(--tb-text)",
          marginTop: 8,
        }}>
          Set the date window
        </h2>
        <p style={{ fontSize: 13, color: "var(--tb-muted)", marginTop: 4 }}>
          Pick a start and end date. Members will vote on which days work for them.
        </p>
      </div>

      {/* Selection summary */}
      {start && (
        <div style={{
          display: "flex", justifyContent: "center", gap: 8,
          fontSize: 13, fontWeight: 600, color: "var(--tb-orange)",
        }}>
          <span style={{
            padding: "5px 12px", borderRadius: 10,
            background: "rgba(255,107,53,0.08)",
          }}>
            {format(start, "d MMM")}
          </span>
          {end && (
            <>
              <span style={{ color: "var(--tb-light)", alignSelf: "center" }}>→</span>
              <span style={{
                padding: "5px 12px", borderRadius: 10,
                background: "rgba(255,107,53,0.08)",
              }}>
                {format(end, "d MMM")}
              </span>
            </>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 4px",
      }}>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          disabled={isBefore(endOfMonth(addMonths(currentMonth, -1)), today)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 18, color: "var(--tb-muted)", padding: "4px 8px",
            opacity: isBefore(endOfMonth(addMonths(currentMonth, -1)), today) ? 0.3 : 1,
          }}
        >
          ←
        </button>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 18, color: "var(--tb-muted)", padding: "4px 8px",
          }}
        >
          →
        </button>
      </div>

      {/* Two months */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {renderMonth(days, startPadding, format(currentMonth, "MMMM yyyy"))}
        {renderMonth(nextDays, nextStartPadding, format(nextMonth, "MMMM yyyy"))}
      </div>

      {/* Save button */}
      <motion.button
        onClick={handleSave}
        disabled={!start || !end || saving}
        whileTap={start && end ? { scale: 0.97 } : {}}
        style={{
          width: "100%", padding: 16, borderRadius: 18,
          border: "none",
          background: start && end
            ? "linear-gradient(135deg, var(--tb-orange) 0%, var(--tb-orange-light) 100%)"
            : "rgba(0,0,0,0.06)",
          color: start && end ? "#fff" : "var(--tb-light)",
          fontSize: 15, fontWeight: 700,
          cursor: start && end ? "pointer" : "default",
          fontFamily: "var(--font-sans)",
          boxShadow: start && end ? "0 4px 16px rgba(255,107,53,0.25)" : "none",
          opacity: !start || !end ? 0.6 : 1,
          transition: "all 0.2s ease",
        }}
      >
        {saving
          ? "Saving..."
          : start && end
            ? `Set window: ${format(start, "d MMM")} → ${format(end, "d MMM")}`
            : "Pick start & end dates"}
      </motion.button>
    </div>
  );
}
