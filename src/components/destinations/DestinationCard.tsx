"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TravelOption {
  mode: string;
  duration_hours: number;
  approximate_cost_inr: number;
}

interface Destination {
  id: string;
  name: string;
  pitch: string;
  estimated_cost_min: number | null;
  estimated_cost_max: number | null;
  pros: string[];
  cons: string[];
  travel_options: TravelOption[];
  photo_url?: string | null;
  why_fits_group?: string | null;
}

const MODE_ICONS: Record<string, string> = {
  flight: "✈️",
  train: "🚂",
  bus: "🚌",
  drive: "🚗",
};

function formatINR(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

interface Props {
  destination: Destination;
  rank?: number;
  showRank?: boolean;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function DestinationCard({ destination: dest, rank, showRank, isDragging, dragHandleProps }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className={`rounded-2xl overflow-hidden transition-shadow ${
        isDragging ? "shadow-xl scale-105" : "shadow-sm"
      }`}
      style={{
        backgroundColor: "white",
        border: isDragging ? "2px solid var(--tb-orange)" : "1px solid var(--tb-sand)",
      }}
    >
      {/* Photo hero */}
      <div
        className="relative h-44"
        style={{ background: "linear-gradient(135deg, var(--tb-orange-light), var(--tb-teal-light))" }}
      >
        {dest.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dest.photo_url}
            alt={dest.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🏔️
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Destination name */}
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-end justify-between">
            <h3 className="text-xl font-bold text-white leading-tight">{dest.name}</h3>
            {showRank && rank && (
              <div className="flex items-center gap-1">
                {/* Drag handle */}
                <div {...dragHandleProps} className="text-white/60 cursor-grab active:cursor-grabbing px-1">
                  ⋮⋮
                </div>
                <div
                  className="w-7 h-7 rounded-full backdrop-blur flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: "var(--tb-orange)", opacity: 0.9 }}
                >
                  {rank}
                </div>
              </div>
            )}
          </div>
          {dest.estimated_cost_min && dest.estimated_cost_max && (
            <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--tb-teal-light)" }}>
              {formatINR(dest.estimated_cost_min)}–{formatINR(dest.estimated_cost_max)}/person
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Pitch */}
        <p className="text-sm italic leading-relaxed" style={{ color: "var(--tb-muted)" }}>{dest.pitch}</p>

        {/* Why fits group */}
        {dest.why_fits_group && (
          <div
            className="rounded-xl px-3 py-2.5 flex gap-2"
            style={{ backgroundColor: "var(--tb-cream)" }}
          >
            <span className="text-base shrink-0">✨</span>
            <p className="text-xs leading-relaxed" style={{ color: "var(--tb-text)" }}>{dest.why_fits_group}</p>
          </div>
        )}

        {/* Pros & cons */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between text-sm"
          style={{ color: "var(--tb-muted)" }}
        >
          <span>Details</span>
          <span style={{ color: "var(--tb-light)" }}>{expanded ? "▲" : "▼"}</span>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3">
                {/* Pros */}
                {dest.pros.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {dest.pros.map((p) => (
                      <span
                        key={p}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: "rgba(0,168,168,0.1)", color: "var(--tb-teal-dark)" }}
                      >
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                )}

                {/* Cons */}
                {dest.cons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {dest.cons.map((c) => (
                      <span
                        key={c}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: "var(--tb-sand)", color: "var(--tb-text)" }}
                      >
                        ⚠ {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Travel options */}
                {dest.travel_options && dest.travel_options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {dest.travel_options.map((t) => (
                      <div
                        key={t.mode}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full"
                        style={{ backgroundColor: "var(--tb-cream)", border: "1px solid var(--tb-sand)", color: "var(--tb-muted)" }}
                      >
                        <span>{MODE_ICONS[t.mode] ?? "🚀"}</span>
                        <span className="capitalize">{t.mode}</span>
                        <span style={{ color: "var(--tb-light)" }}>{t.duration_hours}h</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
