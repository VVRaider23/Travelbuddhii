"use client";

import { useMemo } from "react";
import { format, parseISO, addDays, differenceInDays } from "date-fns";

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
    <div className="mx-4 bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Availability summary</p>
        <p className="text-xs text-gray-400">{voterCount}/{totalMembers} responded</p>
      </div>

      {bestRanges.length > 0 ? (
        <div className="flex flex-col gap-2">
          {bestRanges.map((r, i) => (
            <div key={r.start} className="flex items-center gap-2">
              {i === 0 && <span className="text-sm">🏆</span>}
              {i === 1 && <span className="text-sm">🥈</span>}
              {i === 2 && <span className="text-sm">🥉</span>}
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{formatRange(r)}</span>
                <span className="text-xs text-gray-400 ml-2">works for {r.count}/{totalMembers}</span>
              </div>
            </div>
          ))}
        </div>
      ) : voterCount < 2 ? (
        <p className="text-sm text-gray-400">Waiting for more votes to show overlap...</p>
      ) : (
        <p className="text-sm text-gray-400">No dates work for 50%+ yet. Widen the window?</p>
      )}

      {nonVoters.length > 0 && (
        <p className="text-xs text-amber-600">
          {nonVoters.length} {nonVoters.length === 1 ? "person hasn't" : "people haven't"} voted yet
        </p>
      )}
    </div>
  );
}
