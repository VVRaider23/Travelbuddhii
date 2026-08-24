"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useTripStore } from "@/store/tripStore";
import type { DestinationOutcome } from "@/lib/destinationOutcome";
import { CompactDestCard, getDestTheme } from "@/components/destinations/CompactDestCard";
import { AIGenerateState } from "@/components/destinations/AIGenerateState";
import { StepFooter } from "@/components/layout/StepFooter";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

/* ── Types ── */

interface TravelOption {
  from?: string;
  mode: string;
  duration_hours: number;
  cost_inr?: number;
}

interface OffbeatExperience {
  name: string;
  description: string;
  category: string;
  local_tip?: string;
}

interface Destination {
  id: string;
  name: string;
  pitch: string;
  estimated_cost_min: number | null;
  estimated_cost_max: number | null;
  pros: string[];
  cons: string[];
  travel_options: TravelOption[];
  photo_url?: string | null;
  why_fits_group?: string | null;
  season_score?: number | null;
  seasonality_note?: string | null;
  offbeat_experiences?: OffbeatExperience[];
}

interface VoteData {
  trip: { id: string; status: string; destination: string | null };
  destinations: Destination[];
  voteCounts: Record<string, number>;
  myPicks: string[];
  voters: string[];
  members: { user_id: string; role: string }[];
  /** Decided server-side by the same code the vote route acts on. */
  outcome: DestinationOutcome<{ id: string; name: string }>;
}

/* ── Page ── */

export default function DestinationsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const userRole = useTripStore((s) => s.userRole);
  const budgetMin = useTripStore((s) => s.budgetMin);
  const budgetMax = useTripStore((s) => s.budgetMax);
  const tripVibes = useTripStore((s) => s.tripVibes);
  const dateWindowStart = useTripStore((s) => s.dateWindowStart);
  const dateWindowEnd = useTripStore((s) => s.dateWindowEnd);
  const confirmedStart = useTripStore((s) => s.confirmedStart);
  const confirmedEnd = useTripStore((s) => s.confirmedEnd);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [locking, setLocking] = useState(false);
  const [data, setData] = useState<VoteData | null>(null);
  const [picks, setPicks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [lockConfirm, setLockConfirm] = useState<string | null>(null);
  const [revealState, setRevealState] = useState<{ active: boolean; count: number; total: number }>({
    active: false, count: 0, total: 0,
  });

  const dateStart = confirmedStart ?? dateWindowStart;
  const dateEnd = confirmedEnd ?? dateWindowEnd;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const picksInitialized = useRef(false);

  async function loadData() {
    try {
      const res = await fetch(`/api/trips/${slug}/destinations/vote`);
      const d = await res.json();
      setData(d);
      if (!picksInitialized.current && d.myPicks?.length > 0) {
        setPicks(d.myPicks);
        picksInitialized.current = true;
      }
    } catch {
      toast.error("Could not load destinations");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Staggered reveal timer
  useEffect(() => {
    if (!revealState.active) return;
    if (revealState.count >= revealState.total) {
      const timer = setTimeout(() => setRevealState({ active: false, count: 0, total: 0 }), 600);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setRevealState((prev) => ({ ...prev, count: prev.count + 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [revealState]);

  // Auto-save picks (debounced)
  const savePicks = useCallback(async (newPicks: string[]) => {
    setSaving(true);
    const res = await fetch(`/api/trips/${slug}/destinations/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ picks: newPicks }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save vote. Try again.");
      return;
    }

    // The last vote in decides the trip, so say so rather than letting the
    // destination quietly change under the person who just voted.
    const body = await res.json().catch(() => null);
    if (body?.outcome?.kind === "winner") {
      toast.success(
        body.outcome.reason === "budget"
          ? `Tied on votes, so ${body.outcome.destination.name} wins on budget. Moving to itinerary planning.`
          : `${body.outcome.destination.name} wins! Moving to itinerary planning.`
      );
    } else if (body?.outcome?.kind === "tie") {
      toast("It's a tie. The organizer picks between the top places.");
    }

    await loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function togglePick(destId: string) {
    setPicks((prev) => {
      let next: string[];
      if (prev.includes(destId)) {
        next = prev.filter((id) => id !== destId);
      } else {
        if (prev.length >= 2) {
          toast("You can only pick 2 favourites", { icon: "\u261D\uFE0F" });
          return prev;
        }
        next = [...prev, destId];
      }

      // Debounced auto-save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => savePicks(next), 600);

      return next;
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch(`/api/trips/${slug}/destinations/generate`, { method: "POST" });
    const body = await res.json();
    setGenerating(false);

    if (!res.ok) {
      toast.error(body.error ?? "AI generation failed. Try again.");
      return;
    }

    toast.success(`${body.destinations.length} destinations suggested!`);
    await loadData();
    setRevealState({ active: true, count: 0, total: body.destinations.length });
  }

  async function handleLock(destinationId: string) {
    setLocking(true);
    const res = await fetch(`/api/trips/${slug}/destinations/vote`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination_id: destinationId }),
    });
    const body = await res.json();
    setLocking(false);

    if (!res.ok) {
      // The server refuses a pick outside the tied set, and names the tie.
      toast.error(body.error ?? "Could not lock destination.");
      return;
    }

    toast.success(`${body.destination} selected! Moving to itinerary planning.`);
    setLockConfirm(null);
    await loadData();
  }

  if (loading) return <PageSkeleton />;

  const isLocked = !!data?.trip.destination;
  const destinations = data?.destinations ?? [];
  const hasDestinations = destinations.length > 0;
  const hasVoted = picks.length > 0;
  const voterCount = data?.voters.length ?? 0;
  const memberCount = data?.members.length ?? 0;

  // Sort by vote count for display
  const sortedByVotes = [...destinations].sort((a, b) => {
    const va = data?.voteCounts[a.id] ?? 0;
    const vb = data?.voteCounts[b.id] ?? 0;
    return vb - va;
  });

  const topDest = sortedByVotes[0];
  const result = data?.outcome;
  const isTied = !isLocked && result?.kind === "tie";
  // A clear winner locks itself the moment the last person votes, so the manual
  // lock is only an escape hatch for when some members never get round to it.
  const canLockEarly =
    !isLocked &&
    !isTied &&
    userRole === "organizer" &&
    result?.kind === "waiting" &&
    voterCount > 0;

  return (
    <div style={{ minHeight: "calc(100vh - 132px)", background: "#F5F1EB", fontFamily: "inherit" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cardReveal { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Page header ── */}
        <div style={{
          background: "linear-gradient(145deg, #fff 0%, #FEFCF9 100%)",
          padding: "20px 16px 16px",
          borderBottom: "1px solid rgba(0,0,0,0.04)",
          animation: "fadeUp 0.4s ease-out both",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 className="font-playfair" style={{ fontSize: 22, fontWeight: 800, color: "#2D2A26", display: "flex", alignItems: "center", gap: 8 }}>
                <span>{"\uD83D\uDDFA\uFE0F"}</span> Choose destination
              </h1>
              <p style={{ fontSize: 13, color: "#6B6560", marginTop: 4 }}>
                {isLocked
                  ? `Locked: ${data?.trip.destination}`
                  : revealState.active
                    ? `Revealing ${revealState.count}/${revealState.total} destinations...`
                    : hasDestinations
                      ? `${destinations.length} options \u00B7 ${voterCount}/${memberCount} voted`
                      : "AI will suggest options based on your group"}
              </p>
            </div>
            {isLocked && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100,
                background: "rgba(0,168,168,0.12)", color: "#008B8B",
              }}>
                Locked {"\u2713"}
              </span>
            )}
          </div>
        </div>

        {/* ── EMPTY / GENERATING ── */}
        {!hasDestinations && !isLocked && !revealState.active && (
          <AIGenerateState
            onGenerate={handleGenerate}
            generating={generating}
            isOrganizer={userRole === "organizer"}
            budgetMin={budgetMin}
            budgetMax={budgetMax}
            vibes={tripVibes}
            dateStart={dateStart}
            dateEnd={dateEnd}
          />
        )}

        {/* ── REVEALING (staggered) ── */}
        {revealState.active && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 16px" }}>
            <div style={{ textAlign: "center", padding: "8px 0", animation: "fadeIn 0.4s ease both" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#FF6B35" }}>
                {revealState.count === 0 ? "And the suggestions are..." : `${revealState.count} of ${revealState.total} revealed`}
              </span>
            </div>
            {destinations.slice(0, revealState.count).map((dest, i) => {
              const theme = getDestTheme(i);
              return (
                <CompactDestCard
                  key={dest.id}
                  destination={dest}
                  themeGradient={theme.gradient}
                  themeAccent={theme.accent}
                  themeEmoji={theme.emoji}
                  revealDelay={0}
                />
              );
            })}
          </div>
        )}

        {/* ── VIEW MODE (with voting) ── */}
        {hasDestinations && !revealState.active && (
          <>
            {/* Status message */}
            {!isLocked && (
              <div style={{
                margin: "0 16px", padding: "10px 14px", borderRadius: 12,
                background: hasVoted ? "rgba(37,211,102,0.06)" : "rgba(255,107,53,0.05)",
                border: `1px solid ${hasVoted ? "rgba(37,211,102,0.1)" : "rgba(255,107,53,0.08)"}`,
                display: "flex", alignItems: "center", gap: 8,
                animation: "fadeIn 0.4s ease-out both",
              }}>
                <span style={{ fontSize: 15 }}>{hasVoted ? "\u2705" : "\uD83D\uDC46"}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: hasVoted ? "#1EBD5A" : "#FF6B35" }}>
                  {saving
                    ? "Saving your vote..."
                    : hasVoted
                      ? `${picks.length}/2 picked \u00B7 ${voterCount}/${memberCount} have voted`
                      : "Pick your top 2 favourites"}
                </span>
              </div>
            )}

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 16px" }}>
              {(isLocked ? sortedByVotes : destinations).map((dest, i) => {
                const theme = getDestTheme(i);
                const isWinner = isLocked && sortedByVotes[0]?.id === dest.id;
                return (
                  <div key={dest.id} style={{ position: "relative" }}>
                    {isWinner && (
                      <div style={{
                        position: "absolute", top: -8, left: 16, zIndex: 5,
                        fontSize: 11, fontWeight: 700, color: "#fff",
                        padding: "3px 10px", borderRadius: 100,
                        background: "#FF6B35",
                      }}>
                        {"\uD83C\uDFC6"} Group favourite
                      </div>
                    )}
                    <CompactDestCard
                      destination={dest}
                      themeGradient={theme.gradient}
                      themeAccent={theme.accent}
                      themeEmoji={theme.emoji}
                      isVoted={picks.includes(dest.id)}
                      onToggleVote={isLocked ? undefined : () => togglePick(dest.id)}
                      voteCount={voterCount > 0 ? (data?.voteCounts[dest.id] ?? 0) : undefined}
                      revealDelay={0.08 * i}
                      saving={saving}
                    />
                  </div>
                );
              })}
            </div>

            {/* Regenerate (organizer only) */}
            {!isLocked && userRole === "organizer" && (
              <div style={{ padding: "0 16px", animation: "fadeUp 0.4s ease-out 0.3s both" }}>
                <button onClick={handleGenerate} disabled={generating} style={{
                  width: "100%", padding: "14px 20px", borderRadius: 18,
                  border: "1px solid rgba(0,0,0,0.08)", background: "#fff",
                  color: "#6B6560", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                  cursor: generating ? "wait" : "pointer", opacity: generating ? 0.5 : 1,
                }}>
                  {generating ? "Generating..." : "Regenerate suggestions"}
                </button>
              </div>
            )}

            {/* ── Waiting on the rest of the group ── */}
            {!isLocked && result?.kind === "waiting" && result.remaining > 0 && hasVoted && (
              <div style={{
                margin: "0 16px", padding: "14px 16px", borderRadius: 16,
                background: "#fff", border: "1px solid rgba(0,0,0,0.05)",
                animation: "fadeUp 0.4s ease-out 0.2s both",
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#2D2A26", margin: 0 }}>
                  Waiting on {result.remaining} more{" "}
                  {result.remaining === 1 ? "person" : "people"}
                </p>
                <p style={{ fontSize: 12, color: "#6B6560", marginTop: 4, lineHeight: 1.5 }}>
                  The most-voted place is picked automatically once everyone has voted.
                </p>
              </div>
            )}

            {/* ── Tie: only the organizer settles it, and only between the tied places ── */}
            {isTied && result.kind === "tie" && (
              <div style={{
                margin: "0 16px", padding: "18px 16px", borderRadius: 20,
                background: "linear-gradient(145deg, #FFF0E8, #FFF5EE)",
                border: "1.5px solid rgba(255,107,53,0.15)",
                animation: "fadeUp 0.4s ease-out 0.2s both",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15 }}>{"⚖️"}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#E55A25" }}>
                    It&apos;s a tie
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#6B6560", marginBottom: 14, lineHeight: 1.5 }}>
                  {result.tied.map((d) => d.name).join(" and ")} each got {result.votes}{" "}
                  {result.votes === 1 ? "vote" : "votes"}, and the group&apos;s budget
                  does not separate them either.{" "}
                  {userRole === "organizer"
                    ? "You pick which one."
                    : "The organizer picks which one."}
                </p>

                {userRole === "organizer" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {result.tied.map((tied, i) => {
                      const theme = getDestTheme(i);
                      const confirming = lockConfirm === tied.id;
                      return (
                        <div key={tied.id} style={{
                          padding: "12px 14px", borderRadius: 14,
                          background: "#fff", border: `1.5px solid ${theme.accent}20`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 22 }}>{theme.emoji}</span>
                            <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#2D2A26" }}>
                              {tied.name}
                            </span>
                            {!confirming && (
                              <button onClick={() => setLockConfirm(tied.id)} style={{
                                padding: "7px 14px", borderRadius: 10, border: "none",
                                background: "linear-gradient(135deg, #FF6B35, #FF8F5E)",
                                color: "#fff", fontSize: 12, fontWeight: 700,
                                cursor: "pointer", fontFamily: "inherit",
                              }}>
                                Choose
                              </button>
                            )}
                          </div>
                          {confirming && (
                            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                              <button onClick={() => setLockConfirm(null)} style={{
                                flex: 1, padding: 10, borderRadius: 10,
                                border: "1px solid rgba(0,0,0,0.08)", background: "#fff",
                                fontSize: 12, fontWeight: 600, color: "#6B6560",
                                cursor: "pointer", fontFamily: "inherit",
                              }}>Cancel</button>
                              <button onClick={() => handleLock(tied.id)} disabled={locking} style={{
                                flex: 1, padding: 10, borderRadius: 10, border: "none",
                                background: "linear-gradient(135deg, #FF6B35, #FF8F5E)",
                                fontSize: 12, fontWeight: 700, color: "#fff",
                                cursor: "pointer", fontFamily: "inherit",
                                opacity: locking ? 0.7 : 1,
                              }}>
                                {locking ? "Locking..." : `Yes, ${tied.name}`}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Organizer escape hatch when some members never vote ── */}
            {canLockEarly && topDest && (
              <div style={{
                margin: "0 16px", padding: "18px 16px", borderRadius: 20,
                background: "linear-gradient(145deg, #FFF0E8, #FFF5EE)",
                border: "1.5px solid rgba(255,107,53,0.15)",
                animation: "fadeUp 0.4s ease-out 0.2s both",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15 }}>{"\uD83C\uDFC6"}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#E55A25" }}>Lock destination (organizer)</span>
                </div>
                <p style={{ fontSize: 12, color: "#6B6560", marginBottom: 14, lineHeight: 1.5 }}>
                  {result?.kind === "waiting" && result.remaining > 0
                    ? `${result.remaining} ${result.remaining === 1 ? "person has" : "people have"} not voted. You can lock the current leader now rather than keep waiting.`
                    : "Lock the group's top pick to move to itinerary planning."}
                </p>

                {/* Top destination preview */}
                {(() => {
                  const theme = getDestTheme(0);
                  return (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 14,
                      background: "#fff", border: `1.5px solid ${theme.accent}20`,
                      marginBottom: 14,
                    }}>
                      <span style={{ fontSize: 24 }}>{theme.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#2D2A26" }}>{topDest.name}</span>
                        <span style={{ fontSize: 12, color: "#6B6560", marginLeft: 8 }}>
                          {data?.voteCounts[topDest.id] ?? 0} votes
                        </span>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: theme.accent,
                        padding: "3px 8px", borderRadius: 6, background: `${theme.accent}10`,
                      }}>#1</span>
                    </div>
                  );
                })()}

                {/* Two-step confirmation */}
                {lockConfirm !== topDest.id ? (
                  <button onClick={() => setLockConfirm(topDest.id)} style={{
                    width: "100%", padding: "14px 20px", borderRadius: 14, border: "none",
                    background: "linear-gradient(135deg, #FF6B35, #FF8F5E)",
                    color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                    cursor: "pointer", boxShadow: "0 3px 10px rgba(255,107,53,0.15)",
                  }}>
                    Lock {topDest.name} {"\u2192"}
                  </button>
                ) : (
                  <div style={{ animation: "fadeUp 0.3s ease-out both" }}>
                    <div style={{
                      padding: 14, borderRadius: 14, background: "#fff",
                      border: "1px solid rgba(0,0,0,0.06)", textAlign: "center", marginBottom: 10,
                    }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#2D2A26" }}>Lock {topDest.name} as the destination?</p>
                      <p style={{ fontSize: 12, color: "#6B6560", marginTop: 4 }}>This notifies everyone and moves to itinerary planning.</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setLockConfirm(null)} style={{
                        flex: 1, padding: 12, borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.08)", background: "#fff",
                        fontSize: 13, fontWeight: 600, color: "#6B6560",
                        cursor: "pointer", fontFamily: "inherit",
                      }}>Cancel</button>
                      <button onClick={() => handleLock(topDest.id)} disabled={locking} style={{
                        flex: 1, padding: 12, borderRadius: 12, border: "none",
                        background: "linear-gradient(135deg, #FF6B35, #FF8F5E)",
                        fontSize: 13, fontWeight: 700, color: "#fff",
                        cursor: "pointer", fontFamily: "inherit",
                        opacity: locking ? 0.7 : 1,
                      }}>
                        {locking ? "Locking..." : "Yes, lock it"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Votes autosave on a debounce, so there is never unsaved work to warn about */}
      <StepFooter
        slug={slug}
        current="destinations"
        workState={saving ? "saving" : "saved"}
      />
    </div>
  );
}
