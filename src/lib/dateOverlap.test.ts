import { describe, it, expect } from "vitest";
import {
  computeHeatmap,
  voterCount,
  findBestRanges,
  bestConsensusRanges,
  datesInRange,
  isValidLockRange,
  type DateVote,
} from "./dateOverlap";

/** Builds the one-row-per-available-date shape the app actually stores. */
function votesFor(userId: string, dates: string[]): DateVote[] {
  return dates.map((date) => ({ user_id: userId, date, is_available: true }));
}

function septemberDays(from: number, to: number): string[] {
  const dates: string[] = [];
  for (let day = from; day <= to; day++) {
    dates.push(`2026-09-${String(day).padStart(2, "0")}`);
  }
  return dates;
}

describe("the trip that shipped the wrong dates", () => {
  // Trip class-11-trip-v8eg, read from production on 2026-08-24. One member was
  // free Sep 2-7, the organizer Sep 2-9, and the app locked Sep 2-9.
  const votes = [
    ...votesFor("member", septemberDays(2, 7)),
    ...votesFor("organizer", septemberDays(2, 9)),
  ];

  it("offers the intersection, not the organizer's span", () => {
    const result = bestConsensusRanges(votes);

    expect(result.ranges).toHaveLength(1);
    expect(result.ranges[0]).toEqual({
      start: "2026-09-02",
      end: "2026-09-07",
      count: 2,
    });
  });

  it("reports that the window works for everyone who voted", () => {
    const result = bestConsensusRanges(votes);

    expect(result.voterCount).toBe(2);
    expect(result.threshold).toBe(2);
    expect(result.isUnanimous).toBe(true);
  });

  it("rejects the window the app actually locked", () => {
    expect(isValidLockRange(votes, "2026-09-02", "2026-09-09")).toBe(false);
  });

  it("accepts the true intersection", () => {
    expect(isValidLockRange(votes, "2026-09-02", "2026-09-07")).toBe(true);
  });

  it("accepts a window inside the intersection", () => {
    expect(isValidLockRange(votes, "2026-09-03", "2026-09-05")).toBe(true);
  });
});

describe("computeHeatmap", () => {
  it("counts one per person per date", () => {
    const votes = [
      ...votesFor("a", ["2026-09-01", "2026-09-02"]),
      ...votesFor("b", ["2026-09-02"]),
    ];

    expect(computeHeatmap(votes)).toEqual({
      "2026-09-01": 1,
      "2026-09-02": 2,
    });
  });

  it("ignores dates someone marked unavailable", () => {
    const votes: DateVote[] = [
      { user_id: "a", date: "2026-09-01", is_available: true },
      { user_id: "b", date: "2026-09-01", is_available: false },
    ];

    expect(computeHeatmap(votes)).toEqual({ "2026-09-01": 1 });
  });
});

describe("voterCount", () => {
  it("counts people, not rows", () => {
    expect(voterCount(votesFor("a", septemberDays(1, 10)))).toBe(1);
  });

  it("does not count someone with no available date", () => {
    const votes: DateVote[] = [
      ...votesFor("a", ["2026-09-01"]),
      { user_id: "b", date: "2026-09-01", is_available: false },
    ];

    expect(voterCount(votes)).toBe(2 - 1);
  });

  it("is zero with no votes", () => {
    expect(voterCount([])).toBe(0);
  });
});

describe("findBestRanges", () => {
  it("splits on a gap instead of spanning it", () => {
    const heatmap = { "2026-09-01": 2, "2026-09-02": 2, "2026-09-05": 2 };

    expect(findBestRanges(heatmap, 2)).toEqual([
      { start: "2026-09-01", end: "2026-09-02", count: 2 },
      { start: "2026-09-05", end: "2026-09-05", count: 2 },
    ]);
  });

  it("prefers the longer window when counts tie", () => {
    const heatmap = {
      "2026-09-01": 2,
      "2026-09-05": 2,
      "2026-09-06": 2,
      "2026-09-07": 2,
    };

    expect(findBestRanges(heatmap, 2)[0]).toEqual({
      start: "2026-09-05",
      end: "2026-09-07",
      count: 2,
    });
  });

  it("returns at most three windows", () => {
    const heatmap: Record<string, number> = {};
    // Five single days, each separated by a gap.
    for (const day of [1, 3, 5, 7, 9]) {
      heatmap[`2026-09-0${day}`] = 2;
    }

    expect(findBestRanges(heatmap, 2)).toHaveLength(3);
  });

  it("returns nothing when no date clears the bar", () => {
    expect(findBestRanges({ "2026-09-01": 1 }, 2)).toEqual([]);
  });

  it("crosses a month boundary as one contiguous window", () => {
    const heatmap = { "2026-09-30": 2, "2026-10-01": 2 };

    expect(findBestRanges(heatmap, 2)).toEqual([
      { start: "2026-09-30", end: "2026-10-01", count: 2 },
    ]);
  });
});

describe("bestConsensusRanges when nobody is free together", () => {
  // Three voters, no single date shared by all three.
  const votes = [
    ...votesFor("a", ["2026-09-01", "2026-09-02"]),
    ...votesFor("b", ["2026-09-02", "2026-09-03"]),
    ...votesFor("c", ["2026-09-08"]),
  ];

  it("steps the requirement down instead of returning nothing", () => {
    const result = bestConsensusRanges(votes);

    expect(result.ranges.length).toBeGreaterThan(0);
    expect(result.threshold).toBe(2);
    expect(result.voterCount).toBe(3);
  });

  it("says plainly that this is not unanimous", () => {
    expect(bestConsensusRanges(votes).isUnanimous).toBe(false);
  });

  it("picks the date the most people share", () => {
    expect(bestConsensusRanges(votes).ranges[0]).toEqual({
      start: "2026-09-02",
      end: "2026-09-02",
      count: 2,
    });
  });
});

describe("bestConsensusRanges edge cases", () => {
  it("returns nothing for no votes", () => {
    expect(bestConsensusRanges([])).toEqual({
      ranges: [],
      threshold: 0,
      voterCount: 0,
      isUnanimous: false,
    });
  });

  it("treats a single voter as unanimous", () => {
    const result = bestConsensusRanges(votesFor("a", septemberDays(1, 3)));

    expect(result.threshold).toBe(1);
    expect(result.isUnanimous).toBe(true);
    expect(result.ranges[0]).toEqual({
      start: "2026-09-01",
      end: "2026-09-03",
      count: 1,
    });
  });

  it("never drops below half the voters", () => {
    // Four voters who share nothing at all.
    const votes = [
      ...votesFor("a", ["2026-09-01"]),
      ...votesFor("b", ["2026-09-03"]),
      ...votesFor("c", ["2026-09-05"]),
      ...votesFor("d", ["2026-09-07"]),
    ];

    const result = bestConsensusRanges(votes);

    expect(result.ranges).toEqual([]);
    expect(result.threshold).toBe(2);
  });
});

describe("datesInRange", () => {
  it("includes both ends", () => {
    expect(datesInRange("2026-09-01", "2026-09-03")).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
  });

  it("handles a single day", () => {
    expect(datesInRange("2026-09-01", "2026-09-01")).toEqual(["2026-09-01"]);
  });

  it("crosses a leap day", () => {
    expect(datesInRange("2028-02-28", "2028-03-01")).toEqual([
      "2028-02-28",
      "2028-02-29",
      "2028-03-01",
    ]);
  });

  it("returns nothing when end precedes start", () => {
    expect(datesInRange("2026-09-03", "2026-09-01")).toEqual([]);
  });
});

describe("isValidLockRange", () => {
  it("allows any window when nobody has voted yet", () => {
    expect(isValidLockRange([], "2026-09-01", "2026-09-05")).toBe(true);
  });

  it("rejects a backwards range", () => {
    expect(isValidLockRange([], "2026-09-05", "2026-09-01")).toBe(false);
  });

  it("rejects a window with a gap the group did not agree to", () => {
    const votes = [
      ...votesFor("a", ["2026-09-01", "2026-09-02", "2026-09-05"]),
      ...votesFor("b", ["2026-09-01", "2026-09-02", "2026-09-05"]),
    ];

    // Sep 3 and 4 are in the window but nobody said they were free.
    expect(isValidLockRange(votes, "2026-09-01", "2026-09-05")).toBe(false);
  });

  it("accepts a compromise window when the threshold stepped down", () => {
    const votes = [
      ...votesFor("a", ["2026-09-02"]),
      ...votesFor("b", ["2026-09-02"]),
      ...votesFor("c", ["2026-09-08"]),
    ];

    expect(isValidLockRange(votes, "2026-09-02", "2026-09-02")).toBe(true);
    expect(isValidLockRange(votes, "2026-09-08", "2026-09-08")).toBe(false);
  });
});
