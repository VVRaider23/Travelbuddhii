"use client";

interface Props {
  overlap: { min: number; max: number } | null;
  respondedCount: number;
  totalMembers: number;
  vibeCount: Record<string, number>;
}

function formatINR(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

function getTripPersonality(min: number, max: number): { label: string; emoji: string; color: string } {
  const mid = (min + max) / 2;
  if (mid < 20000) return { label: "Budget backpackers", emoji: "🎒", color: "#10B981" };
  if (mid < 45000) return { label: "Comfort travelers", emoji: "🏨", color: "#00A8A8" };
  return { label: "Premium explorers", emoji: "✨", color: "#8B5CF6" };
}

export function AnonymousAggregation({ overlap, respondedCount, totalMembers, vibeCount }: Props) {
  const sortedVibes = Object.entries(vibeCount).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-4">
      {/* Budget overlap card */}
      <div
        className="rounded-[18px] p-4 flex flex-col gap-3"
        style={{ background: "rgba(0,168,168,0.04)", border: "1px solid rgba(0,168,168,0.12)" }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "var(--tb-light)" }}
        >
          Group budget overlap
        </p>

        {respondedCount < 2 ? (
          <p className="text-[13px]" style={{ color: "var(--tb-light)" }}>
            Waiting for more responses... ({respondedCount}/{totalMembers} so far)
          </p>
        ) : overlap ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[26px] font-bold" style={{ color: "var(--tb-teal-dark)" }}>
                {formatINR(overlap.min)}
              </span>
              <span className="text-[16px] font-medium" style={{ color: "var(--tb-light)" }}>–</span>
              <span className="text-[26px] font-bold" style={{ color: "var(--tb-teal-dark)" }}>
                {formatINR(overlap.max)}
              </span>
              <span className="text-[12px]" style={{ color: "var(--tb-muted)" }}>per person</span>
            </div>

            {/* Trip personality badge */}
            {(() => {
              const p = getTripPersonality(overlap.min, overlap.max);
              return (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] self-start"
                  style={{ background: `${p.color}10`, border: `1px solid ${p.color}20` }}
                >
                  <span className="text-base">{p.emoji}</span>
                  <span className="text-[12px] font-semibold" style={{ color: p.color }}>
                    {p.label}
                  </span>
                </div>
              );
            })()}

            {/* Visual bar */}
            <div>
              <div
                className="relative h-2.5 rounded-full"
                style={{ background: "var(--tb-sand)" }}
              >
                <div
                  className="absolute h-2.5 rounded-full transition-all duration-700"
                  style={{
                    left: `${(overlap.min / 200000) * 100}%`,
                    width: `${((overlap.max - overlap.min) / 200000) * 100}%`,
                    background: "linear-gradient(90deg, var(--tb-teal), var(--tb-teal-light))",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px]" style={{ color: "var(--tb-light)" }}>₹5K</span>
                <span className="text-[11px] font-medium" style={{ color: "var(--tb-muted)" }}>
                  {respondedCount}/{totalMembers} comfortable in this range
                </span>
                <span className="text-[10px]" style={{ color: "var(--tb-light)" }}>₹2L</span>
              </div>
            </div>
          </>
        ) : (
          <div
            className="rounded-[12px] px-3 py-2.5 text-[13px] font-medium"
            style={{ background: "rgba(245,158,11,0.08)", color: "#D97706" }}
          >
            ⚠️ No overlap yet — budgets don&apos;t intersect. Consider widening your range.
          </div>
        )}
      </div>

      {/* Vibe tally */}
      {sortedVibes.length > 0 && (
        <div
          className="rounded-[18px] p-4 flex flex-col gap-3"
          style={{ background: "rgba(255,107,53,0.04)", border: "1px solid rgba(255,107,53,0.08)" }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--tb-light)" }}
          >
            Group vibes ✨
          </p>
          <div className="flex flex-col gap-2.5">
            {sortedVibes.map(([vibe, count]) => (
              <div key={vibe} className="flex items-center gap-2">
                <span
                  className="text-[13px] font-medium capitalize"
                  style={{ color: "var(--tb-text)", width: 80, flexShrink: 0 }}
                >
                  {vibe}
                </span>
                <div
                  className="flex-1 h-2.5 rounded-full relative"
                  style={{ background: "var(--tb-sand)" }}
                >
                  <div
                    className="absolute h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${(count / totalMembers) * 100}%`,
                      background: "linear-gradient(90deg, var(--tb-orange), var(--tb-orange-light))",
                    }}
                  />
                </div>
                <span
                  className="text-[12px] font-semibold w-6 text-right"
                  style={{ color: "var(--tb-muted)" }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
