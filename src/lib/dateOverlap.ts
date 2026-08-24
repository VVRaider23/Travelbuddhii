/**
 * Which dates the group can actually agree on.
 *
 * This used to live inside the dates page, which meant the server never checked
 * it and the organizer could lock any window at all. It is here so the page that
 * displays the rule and the route that enforces it run the same code.
 *
 * The rule: a date qualifies only if everyone who voted is free on it. Not half
 * the members, which is what the page used to do and which let the organizer's
 * solo days ride along into the locked window.
 */

export interface DateVote {
  user_id: string;
  /** ISO calendar date, yyyy-MM-dd. */
  date: string;
  is_available: boolean;
}

export interface DateRange {
  start: string;
  end: string;
  /** Lowest availability count of any date inside the range. */
  count: number;
}

export interface ConsensusResult {
  /** Best contiguous windows, strongest first. At most three. */
  ranges: DateRange[];
  /** How many voters had to be free for a date to qualify. */
  threshold: number;
  /** Distinct people who have voted at all. */
  voterCount: number;
  /** True when the ranges work for every single person who voted. */
  isUnanimous: boolean;
}

/**
 * Days since the epoch for a yyyy-MM-dd string.
 *
 * Deliberately not date-fns `parseISO` + `differenceInDays`: those build local
 * Date objects, so a range spanning a daylight-saving change can measure 0 or 2
 * days instead of 1 and silently split a contiguous window in half. Production
 * runs UTC and the office runs IST, so the two would not even agree. Calendar
 * dates have no timezone; treating them as UTC midnight keeps it that way.
 */
function toDayNumber(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

function fromDayNumber(dayNumber: number): string {
  return new Date(dayNumber * 86_400_000).toISOString().slice(0, 10);
}

/** date → how many people are free on it. */
export function computeHeatmap(votes: DateVote[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const vote of votes) {
    if (vote.is_available) {
      map[vote.date] = (map[vote.date] ?? 0) + 1;
    }
  }
  return map;
}

/**
 * How many distinct people have voted.
 *
 * Counts only people with at least one available date. Saving votes writes one
 * row per available date and nothing at all for a person who picked none, so
 * an unavailable row is not something the app produces today; ignoring it means
 * a hypothetical all-unavailable voter cannot push the threshold somewhere no
 * date can reach.
 */
export function voterCount(votes: DateVote[]): number {
  const voters = new Set<string>();
  for (const vote of votes) {
    if (vote.is_available) voters.add(vote.user_id);
  }
  return voters.size;
}

/**
 * Contiguous runs of dates that at least `threshold` people are free on,
 * strongest first.
 *
 * Ties on count break toward the longer window, because when two windows both
 * work for everyone the longer trip is the better offer.
 */
export function findBestRanges(
  heatmap: Record<string, number>,
  threshold: number
): DateRange[] {
  const qualifying = Object.entries(heatmap)
    .filter(([, count]) => count >= threshold)
    .map(([date]) => date)
    .sort(); // yyyy-MM-dd sorts chronologically as a string

  if (qualifying.length === 0) return [];

  const ranges: DateRange[] = [];
  let rangeStart = qualifying[0];
  let previous = qualifying[0];
  let lowestInRange = heatmap[qualifying[0]];

  for (let i = 1; i < qualifying.length; i++) {
    const current = qualifying[i];
    if (toDayNumber(current) - toDayNumber(previous) === 1) {
      lowestInRange = Math.min(lowestInRange, heatmap[current]);
      previous = current;
    } else {
      ranges.push({ start: rangeStart, end: previous, count: lowestInRange });
      rangeStart = current;
      previous = current;
      lowestInRange = heatmap[current];
    }
  }
  ranges.push({ start: rangeStart, end: previous, count: lowestInRange });

  const lengthOf = (r: DateRange) => toDayNumber(r.end) - toDayNumber(r.start);

  return ranges
    .sort(
      (a, b) =>
        b.count - a.count ||
        lengthOf(b) - lengthOf(a) ||
        a.start.localeCompare(b.start)
    )
    .slice(0, 3);
}

/**
 * The windows to actually offer the organizer.
 *
 * Starts by demanding everyone who voted is free. If no date clears that bar,
 * steps the requirement down one person at a time rather than returning nothing,
 * stopping at half the voters: below that it is not a consensus worth offering.
 * The threshold that produced the result comes back with it so the UI can say
 * plainly whether this works for everyone or is already a compromise.
 */
export function bestConsensusRanges(votes: DateVote[]): ConsensusResult {
  const heatmap = computeHeatmap(votes);
  const voters = voterCount(votes);

  if (voters === 0) {
    return { ranges: [], threshold: 0, voterCount: 0, isUnanimous: false };
  }

  const floor = Math.max(1, Math.ceil(voters / 2));

  for (let threshold = voters; threshold >= floor; threshold--) {
    const ranges = findBestRanges(heatmap, threshold);
    if (ranges.length > 0) {
      return {
        ranges,
        threshold,
        voterCount: voters,
        isUnanimous: threshold === voters,
      };
    }
  }

  return { ranges: [], threshold: floor, voterCount: voters, isUnanimous: false };
}

/** Every calendar date from start to end, both ends included. */
export function datesInRange(start: string, end: string): string[] {
  const first = toDayNumber(start);
  const last = toDayNumber(end);
  if (last < first) return [];

  const dates: string[] = [];
  for (let day = first; day <= last; day++) dates.push(fromDayNumber(day));
  return dates;
}

/**
 * Whether a window is one the group actually agreed to.
 *
 * Every date in it must clear the same bar `bestConsensusRanges` settled on, so
 * the organizer cannot lock a window that quietly includes days half the group
 * said they were busy.
 *
 * With no votes at all there is nothing to contradict, so any well-formed range
 * passes. That is the escape hatch for an organizer setting dates before anyone
 * has answered; the route still checks the range sits inside the trip window.
 */
export function isValidLockRange(
  votes: DateVote[],
  start: string,
  end: string
): boolean {
  if (toDayNumber(end) < toDayNumber(start)) return false;

  const { threshold, voterCount: voters } = bestConsensusRanges(votes);
  if (voters === 0) return true;
  if (threshold === 0) return false;

  const heatmap = computeHeatmap(votes);
  return datesInRange(start, end).every(
    (date) => (heatmap[date] ?? 0) >= threshold
  );
}
