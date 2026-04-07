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

function formatRange(r: DateRange) {
  const start = parseISO(r.start);
  const end = parseISO(r.end);
  if (r.start === r.end) return format(start, "d MMM");
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, "d")}–${format(end, "d MMM")}`;
  }
  return `${format(start, "d MMM")}–${format(end, "d MMM")}`;
}

export function BestDatesSummary({ heatmap, totalMembers, members, votedUserIds, currentUserId }: Props) {
  const nonVoters = members.filter((m) => !votedUserIds.has(m.user_id) && m.user_id !== currentUserId);
  const voterCount = votedUserIds.size;
  const threshold = Math.max(1, Math.ceil(totalMembers * 0.5));
  const bestRanges = useMemo(() => findBestRanges(heatmap, threshold), [heatmap, threshold]);
  const isFirstVoter = voterCount <= 1 && totalMembers > 1;

  return (
    <div
      style={{
        margin: "0 16px",
        borderRadius: 18, padding: "16px",
        background: "rgba(255,255,255,0.95)",
        border: "1px solid rgba(0,0,0,0.04)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--tb-text)" }}>
          Availability summary
        </p>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: "var(--tb-orange)",
        }}>
          {voterCount}/{totalMembers} voted
        </span>
      </div>

      {/* First voter nudge */}
      {isFirstVoter && (
        <p style={{
          fontSize: 13, fontWeight: 500,
          color: "var(--tb-orange)",
          padding: "8px 10px", borderRadius: 10,
          background: "rgba(255,107,53,0.06)",
        }}>
          🎉 You&apos;re the first one! Share so friends can vote
        </p>
      )}

      {/* Best ranges */}
      {bestRanges.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bestRanges.map((r, i) => {
            const pct = r.count / totalMembers;
            const barColor = pct >= 1 ? "#25D366" : pct >= 0.75 ? "#34D399" : pct >= 0.5 ? "#F59E0B" : "var(--tb-orange)";
            return (
              <div
                key={r.start}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 12,
                  background: i === 0 ? "rgba(255,107,53,0.04)" : "rgba(0,0,0,0.015)",
                  border: `1px solid ${i === 0 ? "rgba(255,107,53,0.1)" : "rgba(0,0,0,0.04)"}`,
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{RANK_ICONS[i]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--tb-text)" }}>
                    {formatRange(r)}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--tb-light)", marginLeft: 6 }}>
                    works for {r.count}/{totalMembers}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{
                  width: 48, height: 5, borderRadius: 100,
                  background: "rgba(0,0,0,0.06)", flexShrink: 0,
                }}>
                  <div style={{
                    width: `${pct * 100}%`, height: "100%",
                    borderRadius: 100, background: barColor,
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : voterCount < 2 ? (
        <p style={{ fontSize: 13, color: "var(--tb-light)" }}>
          Waiting for more votes to show overlap...
        </p>
      ) : (
        <p style={{ fontSize: 13, color: "var(--tb-light)" }}>
          No dates work for 50%+ yet. Widen the window?
        </p>
      )}

      {/* Non-voters nudge */}
      {nonVoters.length > 0 && (
        <p style={{
          fontSize: 12, fontWeight: 500,
          padding: "8px 10px", borderRadius: 10,
          background: "rgba(245,158,11,0.08)", color: "#D97706",
        }}>
          ⏳ {nonVoters.length} {nonVoters.length === 1 ? "person hasn't" : "people haven't"} voted yet
        </p>
      )}
    </div>
  );
}
