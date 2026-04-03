"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTripStore } from "@/store/tripStore";
import { DestinationCard } from "@/components/destinations/DestinationCard";
import { RankedChoiceVoting } from "@/components/destinations/RankedChoiceVoting";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

interface TravelOption {
  mode: string;
  duration_hours: number;
  approximate_cost_inr: number;
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
}

interface VoteData {
  trip: { id: string; status: string; destination: string | null };
  destinations: Destination[];
  bordaScores: Record<string, number>;
  myRanking: string[];
  voters: string[];
  members: { user_id: string; role: string }[];
}

export default function DestinationsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const userRole = useTripStore((s) => s.userRole);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [locking, setLocking] = useState(false);
  const [data, setData] = useState<VoteData | null>(null);
  const [mode, setMode] = useState<"view" | "rank">("view");

  async function loadData() {
    try {
      const res = await fetch(`/api/trips/${slug}/destinations/vote`);
      const d = await res.json();
      setData(d);
    } catch {
      toast.error("Could not load destinations");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch(`/api/trips/${slug}/destinations/generate`, {
      method: "POST",
    });

    const body = await res.json();
    setGenerating(false);

    if (!res.ok) {
      toast.error(body.error ?? "AI generation failed. Try again.");
      return;
    }

    toast.success(`${body.destinations.length} destinations suggested!`);
    await loadData();
  }

  async function handleSubmitVote(ranking: string[]) {
    setSubmittingVote(true);
    const res = await fetch(`/api/trips/${slug}/destinations/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ranking }),
    });

    setSubmittingVote(false);

    if (!res.ok) {
      toast.error("Could not submit vote. Try again.");
      return;
    }

    toast.success("Vote submitted!");
    setMode("view");
    await loadData();
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
      toast.error("Could not lock destination.");
      return;
    }

    toast.success(`${body.destination} selected! Moving to itinerary planning.`);
    await loadData();
  }

  if (loading) return <PageSkeleton />;

  const isLocked = !!data?.trip.destination;
  const destinations = data?.destinations ?? [];
  const hasDestinations = destinations.length > 0;

  // Sort by borda score for display
  const sortedByScore = [...destinations].sort((a, b) => {
    const sa = data?.bordaScores[a.id] ?? 0;
    const sb = data?.bordaScores[b.id] ?? 0;
    return sb - sa;
  });

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Choose destination</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isLocked
                ? `Locked: ${data?.trip.destination}`
                : hasDestinations
                ? `${destinations.length} options · ${data?.voters.length ?? 0}/${data?.members.length ?? 0} voted`
                : "AI will suggest options based on your group"}
            </p>
          </div>
          {isLocked && (
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
              Locked ✓
            </span>
          )}
        </div>
      </div>

      {/* Generate button */}
      {!hasDestinations && !isLocked && (
        <div className="px-4 flex flex-col gap-3">
          <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-2">
            <p className="text-sm text-gray-500">Using your group's budget, dates, and vibe preferences</p>
            {userRole === "organizer" ? (
              <motion.button
                onClick={handleGenerate}
                disabled={generating}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: "#25D366" }}
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span> Analysing preferences...
                  </span>
                ) : (
                  "✨ Suggest Destinations (AI)"
                )}
              </motion.button>
            ) : (
              <p className="text-sm text-amber-700 text-center">Waiting for the organizer to generate suggestions</p>
            )}
          </div>
        </div>
      )}

      {/* Destination cards */}
      {hasDestinations && !mode.startsWith("rank") && (
        <>
          <div className="flex flex-col gap-3 px-4">
            {(isLocked ? sortedByScore : destinations).map((dest) => {
              const score = data?.bordaScores[dest.id] ?? 0;
              const isWinner = isLocked && sortedByScore[0]?.id === dest.id;

              return (
                <div key={dest.id} className="relative">
                  {isWinner && (
                    <div className="absolute -top-2 left-4 z-10 bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      🏆 Group favourite
                    </div>
                  )}
                  <DestinationCard destination={dest} />
                  {!isLocked && data && data.voters.length > 0 && (
                    <div className="mt-1 flex items-center gap-1 px-1">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-orange-400 transition-all"
                          style={{
                            width: `${Math.max(...Object.values(data.bordaScores)) > 0
                              ? (score / Math.max(...Object.values(data.bordaScores))) * 100
                              : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{score} pts</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="px-4 flex flex-col gap-2">
            {!isLocked && (
              <>
                <button
                  onClick={() => setMode("rank")}
                  className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-semibold text-sm"
                >
                  {data?.myRanking.length ? "Update my ranking" : "Rank these destinations →"}
                </button>

                {userRole === "organizer" && (
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm disabled:opacity-50"
                  >
                    {generating ? "Generating..." : "Regenerate suggestions"}
                  </button>
                )}
              </>
            )}

            {/* Organizer lock */}
            {!isLocked && userRole === "organizer" && data && data.voters.length >= Math.ceil(data.members.length * 0.5) && (
              <div className="bg-amber-50 rounded-2xl p-4 flex flex-col gap-2 border border-amber-200">
                <p className="text-sm font-semibold text-amber-900">Lock the destination (organizer)</p>
                <p className="text-xs text-amber-700">
                  Enough people have voted. Pick the group&apos;s favourite to advance to itinerary planning.
                </p>
                <button
                  onClick={() => handleLock(sortedByScore[0].id)}
                  disabled={locking || sortedByScore.length === 0}
                  className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {locking ? "Locking..." : `Lock: ${sortedByScore[0]?.name ?? "—"}`}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Ranking mode */}
      {mode === "rank" && hasDestinations && (
        <>
          <div className="px-4">
            <button
              onClick={() => setMode("view")}
              className="text-sm text-gray-400"
            >
              ← Back to view
            </button>
          </div>
          <RankedChoiceVoting
            destinations={destinations}
            initialRanking={data?.myRanking ?? []}
            onSubmit={handleSubmitVote}
            submitting={submittingVote}
          />
        </>
      )}
    </div>
  );
}
