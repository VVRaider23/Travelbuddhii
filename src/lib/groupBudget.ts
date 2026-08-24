/**
 * What the group can actually afford.
 *
 * Everyone submits a range they are comfortable with. The trip has to be
 * planned against the tightest ceiling in the group, because a plan that only
 * works for the people with the most money is not a plan the group can take.
 *
 * The old rule looked for the intersection of every range and gave up when
 * there wasn't one, or when only one person had voted, leaving the trip with no
 * budget at all. The itinerary prompt then quietly invented Rs 40,000.
 */

export interface BudgetVote {
  budget_min: number;
  budget_max: number;
}

/**
 * The figure the trip is planned against: the lowest ceiling anyone submitted.
 *
 * Null with no votes, never a made-up number. Callers must handle that rather
 * than substituting a default, or we are back to inventing budgets.
 */
export function groupCeiling(votes: BudgetVote[]): number | null {
  if (votes.length === 0) return null;
  return Math.min(...votes.map((vote) => vote.budget_max));
}

/**
 * The bottom of the planning range: the highest floor anyone submitted, so
 * nobody is planned below what they consider worth doing.
 *
 * Clamped to the ceiling. When ranges do not overlap, the most demanding floor
 * sits above the tightest ceiling, and an inverted range would break every
 * consumer downstream.
 */
export function groupFloor(votes: BudgetVote[]): number | null {
  if (votes.length === 0) return null;

  const ceiling = groupCeiling(votes)!;
  const highestFloor = Math.max(...votes.map((vote) => vote.budget_min));
  return Math.min(highestFloor, ceiling);
}

/** Whether every submitted range shares at least one rupee with the others. */
export function rangesOverlap(votes: BudgetVote[]): boolean {
  if (votes.length < 2) return true;

  const highestFloor = Math.max(...votes.map((vote) => vote.budget_min));
  const lowestCeiling = Math.min(...votes.map((vote) => vote.budget_max));
  return highestFloor <= lowestCeiling;
}

/** Indian digit grouping, so 22000 reads as 22,000 rather than 22.000. */
export function formatRupees(amount: number): string {
  return `Rs${amount.toLocaleString("en-IN")}`;
}

/**
 * The sentence shown on the budget page and echoed into the AI prompt.
 *
 * Says which number the trip is planned against and why, so nobody has to
 * reverse-engineer it from a range.
 */
export function ceilingExplanation(votes: BudgetVote[]): string {
  const ceiling = groupCeiling(votes);
  if (ceiling === null) return "Nobody has set a budget yet.";

  if (votes.length === 1) {
    return `Planning at ${formatRupees(ceiling)} per person, the only budget set so far.`;
  }

  if (!rangesOverlap(votes)) {
    return `Planning at ${formatRupees(ceiling)} per person. Your ranges do not overlap, so this is the lowest budget in the group.`;
  }

  return `Planning at ${formatRupees(ceiling)} per person, the lowest budget in the group.`;
}
