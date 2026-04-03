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

function getTripType(min: number, max: number): string {
  const mid = (min + max) / 2;
  if (mid < 20000) return "a budget hostel trip";
  if (mid < 45000) return "a mid-range hotel trip";
  return "a premium resort trip";
}

export function AnonymousAggregation({ overlap, respondedCount, totalMembers, vibeCount }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Budget overlap */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Group budget overlap</p>
        {respondedCount < 2 ? (
          <p className="text-sm text-gray-400">
            Waiting for more responses... ({respondedCount}/{totalMembers} so far)
          </p>
        ) : overlap ? (
          <>
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-900">{respondedCount} of {totalMembers} people</span> are comfortable
              between{" "}
              <span className="font-bold text-green-600">{formatINR(overlap.min)}</span>
              {" "}and{" "}
              <span className="font-bold text-green-600">{formatINR(overlap.max)}</span>.
              {" "}That&apos;s {getTripType(overlap.min, overlap.max)}.
            </p>
            {/* Visual bar */}
            <div className="mt-3 relative h-2 rounded-full bg-gray-200">
              <div
                className="absolute h-2 rounded-full bg-green-400"
                style={{
                  left: `${(overlap.min / 200000) * 100}%`,
                  width: `${((overlap.max - overlap.min) / 200000) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">₹5K</span>
              <span className="text-[10px] text-gray-400">₹2L</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-xl">
            No overlap yet — budgets don&apos;t intersect. Consider widening your range.
          </p>
        )}
      </div>

      {/* Vibe tally */}
      {Object.keys(vibeCount).length > 0 && (
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Group vibes</p>
          <div className="flex flex-col gap-2">
            {Object.entries(vibeCount)
              .sort((a, b) => b[1] - a[1])
              .map(([vibe, count]) => (
                <div key={vibe} className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 capitalize w-24 shrink-0">{vibe}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-200 relative">
                    <div
                      className="absolute h-2 rounded-full bg-orange-400 transition-all"
                      style={{ width: `${(count / totalMembers) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
