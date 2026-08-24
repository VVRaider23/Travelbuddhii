/**
 * Where the group is going, decided by the votes rather than by whoever
 * remembers to press a button.
 *
 * Nothing used to set trips.destination except an explicit organizer action.
 * Miss it and every step after it is dead: the itinerary page hides its
 * generate button and says "set a destination first", which is what made
 * generation look broken on trips that had simply never been locked.
 *
 * The rule: once everyone has voted, the most-voted place wins on its own. A
 * tie is the one case a person has to settle, and only the organizer settles it,
 * choosing between the tied places and nothing else.
 */

export interface DestinationVote {
  user_id: string;
  destination_id: string;
}

export interface DestinationLike {
  id: string;
  name: string;
}

export type DestinationOutcome<T extends DestinationLike> =
  /** Not everyone has voted yet. Nothing is decided. */
  | { kind: "waiting"; remaining: number; voted: number; memberCount: number }
  /** One place has strictly more votes than every other. */
  | { kind: "winner"; destination: T; votes: number }
  /** Two or more places share the lead. The organizer picks between them. */
  | { kind: "tie"; tied: T[]; votes: number };

/** destination id → how many people picked it. Every destination gets a key. */
export function tallyVotes(
  votes: DestinationVote[],
  destinations: DestinationLike[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const destination of destinations) counts[destination.id] = 0;

  for (const vote of votes) {
    // A vote for a destination that no longer exists is ignored rather than
    // creating a phantom entry that could win.
    if (vote.destination_id in counts) {
      counts[vote.destination_id] += 1;
    }
  }
  return counts;
}

/**
 * How many distinct people have voted.
 *
 * People may pick up to two places, so rows are not people.
 */
export function distinctVoters(votes: DestinationVote[]): number {
  return new Set(votes.map((vote) => vote.user_id)).size;
}

export function everyoneVoted(votes: DestinationVote[], memberCount: number): boolean {
  return memberCount > 0 && distinctVoters(votes) >= memberCount;
}

/**
 * What the votes currently say.
 *
 * Deliberately decides nothing until every member has voted. Locking on a
 * running leader would let the destination flip under people mid-vote, and an
 * itinerary generated in that window would be for the wrong place.
 */
export function outcome<T extends DestinationLike>(
  votes: DestinationVote[],
  destinations: T[],
  memberCount: number
): DestinationOutcome<T> {
  const voted = distinctVoters(votes);

  if (!everyoneVoted(votes, memberCount) || destinations.length === 0) {
    return {
      kind: "waiting",
      remaining: Math.max(0, memberCount - voted),
      voted,
      memberCount,
    };
  }

  const counts = tallyVotes(votes, destinations);
  const topCount = Math.max(...destinations.map((d) => counts[d.id] ?? 0));

  // Everyone voted but nothing landed on any of these destinations.
  if (topCount === 0) {
    return { kind: "waiting", remaining: 0, voted, memberCount };
  }

  const leaders = destinations.filter((d) => counts[d.id] === topCount);

  return leaders.length === 1
    ? { kind: "winner", destination: leaders[0], votes: topCount }
    : { kind: "tie", tied: leaders, votes: topCount };
}
