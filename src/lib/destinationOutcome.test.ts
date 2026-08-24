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
