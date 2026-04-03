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
  totalMembers: number;
  onLocked: (start: string, end: string) => void;
}

export function DateLockButton({ slug, bestRanges, totalMembers, onLocked }: Props) {
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
      toast.error("Could not lock dates. Try again.");
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
    <div className="mx-4 bg-amber-50 rounded-2xl border border-amber-200 p-4 flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-amber-900">Lock dates (organizer)</p>
        <p className="text-xs text-amber-700 mt-0.5">Choose the best window. This advances the trip to destination voting.</p>
      </div>

      {/* Date range options */}
      <div className="flex flex-col gap-2">
        {bestRanges.map((r) => (
          <button
            key={r.start}
            onClick={() => setSelected(r)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
              selected?.start === r.start
                ? "border-amber-400 bg-amber-100"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              selected?.start === r.start ? "border-amber-500 bg-amber-500" : "border-gray-300"
            }`}>
              {selected?.start === r.start && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{formatRange(r)}</p>
              <p className="text-xs text-gray-500">{r.count}/{totalMembers} available</p>
            </div>
          </button>
        ))}
      </div>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!selected}
          className="w-full py-3 rounded-2xl bg-amber-500 text-white font-semibold text-sm disabled:opacity-50"
        >
          Lock these dates →
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <p className="text-sm text-center text-amber-800 font-medium">
            Lock {selected ? formatRange(selected) : ""}?
          </p>
          <p className="text-xs text-center text-amber-700">
            This will notify everyone and advance the trip to destination voting.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleLock}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Locking..." : "Yes, lock it"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
