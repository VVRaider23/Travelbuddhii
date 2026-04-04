import type { TripStatus } from "@/types/database";

const STATUS_CONFIG: Record<TripStatus, { label: string; color: string; bg: string }> = {
  gathering_inputs: { label: "Gathering", color: "#FF6B35", bg: "rgba(255,107,53,0.1)" },
  voting:           { label: "Voting",    color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  planning:         { label: "Planning",  color: "#00A8A8", bg: "rgba(0,168,168,0.1)"  },
  active:           { label: "Active",    color: "#25D366", bg: "rgba(37,211,102,0.1)" },
  completed:        { label: "Completed", color: "#9A9490", bg: "rgba(154,148,144,0.1)"},
};

export function StatusBadge({ status }: { status: TripStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulseDot"
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </span>
  );
}
