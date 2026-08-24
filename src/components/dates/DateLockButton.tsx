"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, parseISO, differenceInDays } from "date-fns";
import { toast } from "sonner";

interface DateRange {
  start: string;
  end: string;
  count: number;
}

interface Props {
  slug: string;
  bestRanges: DateRange[];
  /** How many people have voted at all. */
  voterCount: number;
  /** True when the offered windows work for every single voter. */
  isUnanimous: boolean;
  onLocked: (start: string, end: string) => void;
}

export function DateLockButton({
  slug,
  bestRanges,
  voterCount,
  isUnanimous,
  onLocked,
}: Props) {
  const [selected, setSelected] = useState<DateRange | null>(bestRanges[0] ?? null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setSelected(bestRanges[0] ?? null);
  }, [bestRanges]);

  if (bestRanges.length === 0) return null;

  async function handleLock() {
    if (!selected) return;
    setLoading(true);

    const res = await fetch(`/api/trips/${slug}/dates/lock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirmed_start: selected.start,
        confirmed_end: selected.end,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      // The server rejects windows the group did not agree on, and says why.
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "Could not lock dates. Try again.");
      return;
    }

    toast.success("Dates locked! Moving to destination voting.");
    onLocked(selected.start, selected.end);
    setShowConfirm(false);
  }

  function formatRange(r: DateRange) {
    const start = parseISO(r.start);
    const end = parseISO(r.end);
    const nights = differenceInDays(end, start);
    return `${format(start, "d MMM")}–${format(end, "d MMM")} (${nights} ${nights === 1 ? "night" : "nights"})`;
  }

  return (
    <div
      className="mx-4 rounded-[18px] p-4 flex flex-col gap-3"
      style={{
        background: "rgba(255,107,53,0.04)",
        border: "1.5px solid rgba(255,107,53,0.15)",
        boxShadow: "0 2px 12px rgba(255,107,53,0.06)",
      }}
    >
      <div>
        <p className="text-[14px] font-bold" style={{ color: "var(--tb-text)" }}>
          🔒 Lock dates (organizer)
        </p>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--tb-muted)" }}>
          {isUnanimous
            ? `These windows work for all ${voterCount} ${voterCount === 1 ? "person" : "people"} who voted.`
            : `No window works for all ${voterCount} voters. These are the best compromises.`}
        </p>
      </div>

      {/* Date range options */}
      <div className="flex flex-col gap-2">
        {bestRanges.map((r) => {
          const isChosen = selected?.start === r.start;
          return (
            <button
              key={r.start}
              onClick={() => setSelected(r)}
              className="flex items-center gap-3 p-3 rounded-[14px] border text-left transition-all"
              style={{
                border: `1.5px solid ${isChosen ? "var(--tb-orange)" : "rgba(0,0,0,0.06)"}`,
                background: isChosen ? "rgba(255,107,53,0.06)" : "rgba(255,255,255,0.8)",
                boxShadow: isChosen ? "0 2px 8px rgba(255,107,53,0.1)" : "none",
              }}
            >
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                style={{
                  borderColor: isChosen ? "var(--tb-orange)" : "rgba(0,0,0,0.15)",
                  background: isChosen ? "var(--tb-orange)" : "transparent",
                }}
              >
                {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: "var(--tb-text)" }}>
                  {formatRange(r)}
                </p>
                <p className="text-[11px]" style={{ color: "var(--tb-muted)" }}>
                  {r.count === voterCount
                    ? `everyone who voted is free (${voterCount})`
                    : `${r.count} of ${voterCount} voters free`}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!selected}
          className="w-full py-3.5 rounded-[16px] text-white text-[14px] font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
          style={{
            background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))",
            boxShadow: "0 3px 12px rgba(255,107,53,0.25)",
          }}
        >
          Lock these dates →
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <p className="text-[13px] text-center font-semibold" style={{ color: "var(--tb-text)" }}>
            Lock {selected ? formatRange(selected) : ""}?
          </p>
          <p className="text-[12px] text-center" style={{ color: "var(--tb-muted)" }}>
            Everyone stops being able to change their dates once this is locked.
            Only you can unlock it. The trip then advances to destination voting.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors"
              style={{ border: "1px solid rgba(0,0,0,0.08)", color: "var(--tb-muted)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleLock}
              disabled={loading}
              className="flex-1 py-2.5 rounded-[12px] text-white text-[13px] font-bold disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))" }}
            >
              {loading ? "Locking..." : "Yes, lock it"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
