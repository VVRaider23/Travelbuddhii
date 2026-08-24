import { describe, it, expect } from "vitest";
import {
  groupCeiling,
  groupFloor,
  rangesOverlap,
  formatRupees,
  ceilingExplanation,
  type BudgetVote,
} from "./groupBudget";

function vote(min: number, max: number): BudgetVote {
  return { budget_min: min, budget_max: max };
}

describe("the group plans to its tightest ceiling", () => {
  const votes = [vote(15000, 55000), vote(10000, 22000), vote(20000, 60000)];

  it("takes the lowest ceiling, not the widest range", () => {
    expect(groupCeiling(votes)).toBe(22000);
  });

  it("takes the highest floor so nobody is planned below their minimum", () => {
    expect(groupFloor(votes)).toBe(20000);
  });

  it("says which number it is planning against and why", () => {
    expect(ceilingExplanation(votes)).toBe(
      "Planning at Rs22,000 per person, the lowest budget in the group."
    );
  });
});

describe("a single vote still sets a budget", () => {
  // The old rule needed two votes before it wrote anything, so a trip with one
  // budget submitted carried a null budget and the AI invented Rs 40,000.
  const votes = [vote(12000, 30000)];

  it("uses that person's ceiling", () => {
    expect(groupCeiling(votes)).toBe(30000);
  });

  it("uses that person's floor", () => {
    expect(groupFloor(votes)).toBe(12000);
  });

  it("says it is the only budget so far", () => {
    expect(ceilingExplanation(votes)).toBe(
      "Planning at Rs30,000 per person, the only budget set so far."
    );
  });
});

describe("ranges that do not overlap", () => {
  // One person tops out below where the other will even start.
  const votes = [vote(40000, 60000), vote(8000, 15000)];

  it("still produces a ceiling instead of giving up", () => {
    expect(groupCeiling(votes)).toBe(15000);
  });

  it("clamps the floor so the range cannot invert", () => {
    expect(groupFloor(votes)).toBe(15000);
    expect(groupFloor(votes)!).toBeLessThanOrEqual(groupCeiling(votes)!);
  });

  it("reports the disagreement", () => {
    expect(rangesOverlap(votes)).toBe(false);
  });

  it("tells the group their ranges do not overlap", () => {
    expect(ceilingExplanation(votes)).toBe(
      "Planning at Rs15,000 per person. Your ranges do not overlap, so this is the lowest budget in the group."
    );
  });
});

describe("no votes", () => {
  it("returns null rather than inventing a number", () => {
    expect(groupCeiling([])).toBeNull();
    expect(groupFloor([])).toBeNull();
  });

  it("says nobody has set a budget", () => {
    expect(ceilingExplanation([])).toBe("Nobody has set a budget yet.");
  });
});

describe("rangesOverlap", () => {
  it("is true when ranges share a boundary exactly", () => {
    expect(rangesOverlap([vote(10000, 20000), vote(20000, 30000)])).toBe(true);
  });

  it("is false when they miss by one rupee", () => {
    expect(rangesOverlap([vote(10000, 20000), vote(20001, 30000)])).toBe(false);
  });

  it("is trivially true for a single vote", () => {
    expect(rangesOverlap([vote(10000, 20000)])).toBe(true);
  });

  it("is trivially true for no votes", () => {
    expect(rangesOverlap([])).toBe(true);
  });
});

describe("formatRupees", () => {
  it("uses Indian digit grouping", () => {
    expect(formatRupees(22000)).toBe("Rs22,000");
    expect(formatRupees(150000)).toBe("Rs1,50,000");
  });
});
