"use client";

import { useMemo } from "react";
import { format, parseISO, differenceInDays } from "date-fns";

interface Member {
  user_id: string;
  role: string;
}

interface Props {
  heatmap: Record<string, number>;
  totalMembers: number;
  members: Member[];
  votedUserIds: Set<string>;
  currentUserId: string;
}

interface DateRange {
  start: string;
  end: string;
  count: number;
}

function findBestRanges(heatmap: Record<string, number>, minCount: number): DateRange[] {
  const dates = Object.entries(heatmap)
    .filter(([, c]) => c >= minCount)
    .map(([d]) => d)
    .sort();

  if (dates.length === 0) return [];

  const ranges: DateRange[] = [];
  let rangeStart = dates[0];
  let prev = dates[0];
  let minInRange = heatmap[dates[0]];

  for (let i = 1; i < dates.length; i++) {
    const curr = dates[i];
    const diff = differenceInDays(parseISO(curr), parseISO(prev));
    if (diff === 1) {
      minInRange = Math.min(minInRange, heatmap[curr]);
      prev = curr;
    } else {
      ranges.push({ start: rangeStart, end: prev, count: minInRange });
      rangeStart = curr;
      prev = curr;
      minInRange = heatmap[curr];
    }
  }
  ranges.push({ start: rangeStart, end: prev, count: minInRange });

  return ranges.sort((a, b) => b.count - a.count).slice(0, 3);
}

const RANK_ICONS = ["🏆", "🥈", "🥉"];

export function BestDatesSummary({ heatmap, totalMembers, members, votedUserIds, currentUserId }: Props) {
  const nonVoters = members.filter((m) => !votedUserIds.has(m.user_id) && m.user_id !== currentUserId);
  const voterCount = votedUserIds.size;
  const threshold = Math.max(1, Math.ceil(totalMembers * 0.5));
  const bestRanges = useMemo(() => findBestRanges(heatmap, threshold), [heatmap, threshold]);

  function formatRange(r: DateRange) {
    const start = parseISO(r.start);
    const end = parseISO(r.end);
    if (r.start === r.end) return format(start, "d MMM");
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, "d")}–${format(end, "d MMM")}`;
    }
    return `${format(start, "d MMM")}–${format(end, "d MMM")}`;
  }

  return (
    <div
      className="mx-4 rounded-[18px] p-4 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.95)",
        border: "1px solid rgba(0,0,0,0.04)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold" style={{ color: "var(--tb-text)" }}>
          Availability summary
        </p>
        <span
          className="text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: "rgba(255,107,53,0.08)", color: "var(--tb-orange)" }}
        >
          {voterCount}/{totalMembers} responded
        </span>
      </div>

      {bestRanges.length > 0 ? (
        <div className="flex flex-col gap-2">
          {bestRanges.map((r, i) => (
            <div
              key={r.start}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-[12px]"
              style={{
                background: i === 0 ? "rgba(255,107,53,0.05)" : "rgba(0,0,0,0.02)",
                border: `1px solid ${i === 0 ? "rgba(255,107,53,0.12)" : "rgba(0,0,0,0.04)"}`,
              }}
            >
              <span className="text-base shrink-0">{RANK_ICONS[i]}</span>
              <div className="flex-1">
                <span className="text-[14px] font-semibold" style={{ color: "var(--tb-text)" }}>
                  {formatRange(r)}
                </span>
                <span className="text-[12px] ml-2" style={{ color: "var(--tb-light)" }}>
                  works for {r.count}/{totalMembers}
                </span>
              </div>
              {i === 0 && r.count === totalMembers && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: "rgba(37,211,102,0.1)", color: "#25D366" }}
                >
                  Everyone ✓
                </span>
              )}
            </div>
          ))}
        </div>
      ) : voterCount < 2 ? (
        <p className="text-[13px]" style={{ color: "var(--tb-light)" }}>
          Waiting for more votes to show overlap...
        </p>
      ) : (
        <p className="text-[13px]" style={{ color: "var(--tb-light)" }}>
          No dates work for 50%+ yet. Widen the window?
        </p>
      )}

      {nonVoters.length > 0 && (
        <p
          className="text-[12px] font-medium px-3 py-2 rounded-[10px]"
          style={{ background: "rgba(245,158,11,0.08)", color: "#D97706" }}
        >
          ⏳ {nonVoters.length} {nonVoters.length === 1 ? "person hasn't" : "people haven't"} voted yet
        </p>
      )}
    </div>
  );
}
