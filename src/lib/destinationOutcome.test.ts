import { describe, it, expect } from "vitest";
import {
  tallyVotes,
  distinctVoters,
  everyoneVoted,
  outcome,
  type DestinationVote,
} from "./destinationOutcome";

const LADAKH = { id: "cb92c3b5", name: "Ladakh" };
const SPITI = { id: "a877e871", name: "Spiti Valley" };
const COORG = { id: "195a85c3", name: "Coorg" };
const DESTINATIONS = [LADAKH, SPITI, COORG];

function pick(userId: string, ...destinationIds: string[]): DestinationVote[] {
  return destinationIds.map((destination_id) => ({ user_id: userId, destination_id }));
}

describe("the trip that had a clear winner", () => {
  // Trip class-11-trip-v8eg, read from production on 2026-08-24: Coorg 2,
  // Spiti 1, Ladakh 1, from two voters who each picked two places.
  const votes = [
    ...pick("voter-a", COORG.id, SPITI.id),
    ...pick("voter-b", COORG.id, LADAKH.id),
  ];

  it("picks Coorg once both members have voted", () => {
    const result = outcome(votes, DESTINATIONS, 2);

    expect(result.kind).toBe("winner");
    expect(result.kind === "winner" && result.destination).toEqual(COORG);
    expect(result.kind === "winner" && result.votes).toBe(2);
  });

  it("decides nothing while a third member has not voted", () => {
    const result = outcome(votes, DESTINATIONS, 3);

    expect(result.kind).toBe("waiting");
    expect(result.kind === "waiting" && result.remaining).toBe(1);
  });
});

describe("the budget settles a dead heat before the organizer is asked", () => {
  // Real cost estimates from production: Goa 25k-35k, Manali 30k-40k,
  // Pondicherry 20k-30k.
  const GOA = { id: "goa", name: "Goa", estimated_cost_min: 25000, estimated_cost_max: 35000 };
  const MANALI = { id: "manali", name: "Manali", estimated_cost_min: 30000, estimated_cost_max: 40000 };
  const PONDI = { id: "pondi", name: "Pondicherry", estimated_cost_min: 20000, estimated_cost_max: 30000 };
  const OPTIONS = [GOA, MANALI, PONDI];

  // Two people, no overlap at all, so everything sits on one vote.
  const deadHeat = [...pick("a", GOA.id), ...pick("b", MANALI.id)];

  it("picks the cheaper of the tied places", () => {
    const result = outcome(deadHeat, OPTIONS, 2, 40000);

    expect(result.kind).toBe("winner");
    expect(result.kind === "winner" && result.destination).toEqual(GOA);
  });

  it("says the budget decided it, not the vote", () => {
    const result = outcome(deadHeat, OPTIONS, 2, 40000);

    expect(result.kind === "winner" && result.reason).toBe("budget");
  });

  it("marks an outright vote win as decided by votes", () => {
    const clear = [...pick("a", GOA.id), ...pick("b", GOA.id)];

    expect(outcome(clear, OPTIONS, 2, 40000).kind === "winner").toBe(true);
    const result = outcome(clear, OPTIONS, 2, 40000);
    expect(result.kind === "winner" && result.reason).toBe("votes");
  });

  it("ignores tied places the group cannot afford", () => {
    // Only Pondicherry starts at or below 22,000.
    const tied = [...pick("a", PONDI.id), ...pick("b", MANALI.id)];
    const result = outcome(tied, OPTIONS, 2, 22000);

    expect(result.kind === "winner" && result.destination).toEqual(PONDI);
  });

  it("leaves it to the organizer when nothing tied is affordable", () => {
    const tied = [...pick("a", GOA.id), ...pick("b", MANALI.id)];

    expect(outcome(tied, OPTIONS, 2, 10000).kind).toBe("tie");
  });

  it("leaves it to the organizer when no budget is set", () => {
    expect(outcome(deadHeat, OPTIONS, 2, null).kind).toBe("tie");
    expect(outcome(deadHeat, OPTIONS, 2).kind).toBe("tie");
  });

  it("leaves it to the organizer when two affordable places cost the same", () => {
    const TWIN_A = { id: "ta", name: "Twin A", estimated_cost_min: 20000, estimated_cost_max: 30000 };
    const TWIN_B = { id: "tb", name: "Twin B", estimated_cost_min: 20000, estimated_cost_max: 30000 };
    const tied = [...pick("a", TWIN_A.id), ...pick("b", TWIN_B.id)];

    expect(outcome(tied, [TWIN_A, TWIN_B], 2, 40000).kind).toBe("tie");
  });

  it("leaves it to the organizer when the tied places have no cost estimate", () => {
    const NO_COST_A = { id: "na", name: "No cost A" };
    const NO_COST_B = { id: "nb", name: "No cost B" };
    const tied = [...pick("a", NO_COST_A.id), ...pick("b", NO_COST_B.id)];

    expect(outcome(tied, [NO_COST_A, NO_COST_B], 2, 40000).kind).toBe("tie");
  });

  it("still uses the one place that has a cost estimate", () => {
    const PRICED = { id: "p", name: "Priced", estimated_cost_min: 18000, estimated_cost_max: 25000 };
    const UNPRICED = { id: "u", name: "Unpriced" };
    const tied = [...pick("a", PRICED.id), ...pick("b", UNPRICED.id)];
    const result = outcome(tied, [PRICED, UNPRICED], 2, 40000);

    expect(result.kind === "winner" && result.destination).toEqual(PRICED);
  });
});

describe("a tie goes to the organizer", () => {
  const votes = [
    ...pick("voter-a", LADAKH.id),
    ...pick("voter-b", COORG.id),
  ];

  it("does not pick a winner", () => {
    expect(outcome(votes, DESTINATIONS, 2).kind).toBe("tie");
  });

  it("offers only the tied places", () => {
    const result = outcome(votes, DESTINATIONS, 2);

    expect(result.kind === "tie" && result.tied).toHaveLength(2);
    expect(result.kind === "tie" && result.tied.map((d) => d.name).sort()).toEqual([
      "Coorg",
      "Ladakh",
    ]);
  });

  it("does not offer the place nobody voted for", () => {
    const result = outcome(votes, DESTINATIONS, 2);

    expect(result.kind === "tie" && result.tied).not.toContainEqual(SPITI);
  });

  it("handles a three-way tie", () => {
    const threeWay = [
      ...pick("a", LADAKH.id),
      ...pick("b", SPITI.id),
      ...pick("c", COORG.id),
    ];
    const result = outcome(threeWay, DESTINATIONS, 3);

    expect(result.kind === "tie" && result.tied).toHaveLength(3);
  });
});

describe("waiting", () => {
  it("waits when nobody has voted", () => {
    const result = outcome([], DESTINATIONS, 4);

    expect(result.kind).toBe("waiting");
    expect(result.kind === "waiting" && result.remaining).toBe(4);
  });

  it("counts a person who picked two places as one voter", () => {
    const result = outcome(pick("solo", LADAKH.id, COORG.id), DESTINATIONS, 2);

    expect(result.kind).toBe("waiting");
    expect(result.kind === "waiting" && result.voted).toBe(1);
    expect(result.kind === "waiting" && result.remaining).toBe(1);
  });

  it("waits when there are no destinations to choose from", () => {
    expect(outcome(pick("a", LADAKH.id), [], 1).kind).toBe("waiting");
  });

  it("waits when everyone voted but for destinations that no longer exist", () => {
    const stale = pick("a", "deleted-destination");

    expect(outcome(stale, DESTINATIONS, 1).kind).toBe("waiting");
  });

  it("never reports negative remaining when extra votes exist", () => {
    const votes = [...pick("a", LADAKH.id), ...pick("b", LADAKH.id)];
    const result = outcome(votes, DESTINATIONS, 1);

    // Both voted though only one member is counted: this resolves, not waits.
    expect(result.kind).toBe("winner");
  });
});

describe("tallyVotes", () => {
  it("gives every destination a count, including zero", () => {
    expect(tallyVotes(pick("a", LADAKH.id), DESTINATIONS)).toEqual({
      [LADAKH.id]: 1,
      [SPITI.id]: 0,
      [COORG.id]: 0,
    });
  });

  it("ignores votes for destinations that are gone", () => {
    const counts = tallyVotes(pick("a", "vanished"), DESTINATIONS);

    expect(counts).not.toHaveProperty("vanished");
    expect(Object.values(counts).every((c) => c === 0)).toBe(true);
  });
});

describe("distinctVoters and everyoneVoted", () => {
  it("counts people rather than rows", () => {
    expect(distinctVoters(pick("a", LADAKH.id, COORG.id))).toBe(1);
  });

  it("is satisfied when voters reach the member count", () => {
    const votes = [...pick("a", LADAKH.id), ...pick("b", COORG.id)];

    expect(everyoneVoted(votes, 2)).toBe(true);
    expect(everyoneVoted(votes, 3)).toBe(false);
  });

  it("is false for a trip with no members", () => {
    expect(everyoneVoted([], 0)).toBe(false);
  });
});
