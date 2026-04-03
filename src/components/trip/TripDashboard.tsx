"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTripStore } from "@/store/tripStore";
import { MemberAvatarRow } from "@/components/shared/MemberAvatarRow";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { TripStatus } from "@/types/database";

interface TripData {
  id: string;
  name: string;
  status: TripStatus;
  destination: string | null;
  confirmed_start: string | null;
  confirmed_end: string | null;
  budget_min: number | null;
  budget_max: number | null;
  vibes: string[];
}

interface Props {
  slug: string;
  trip: TripData;
  members: { user_id: string; role: string; joined_at: string }[];
  currentUserId: string;
}

const STAGES: { key: TripStatus; label: string }[] = [
  { key: "gathering_inputs", label: "Gathering" },
  { key: "voting", label: "Voting" },
  { key: "planning", label: "Planning" },
  { key: "active", label: "Active" },
];

const STATUS_STEPS = [
  {
    path: "dates",
    icon: "🗓️",
    title: "Pick Dates",
    description: "Vote on when everyone's free",
  },
  {
    path: "budget",
    icon: "💰",
    title: "Budget + Vibe",
    description: "Set your range (stays private)",
  },
  {
    path: "destinations",
    icon: "🗺️",
    title: "Choose Destination",
    description: "AI suggests, group votes",
  },
  {
    path: "itinerary",
    icon: "✈️",
    title: "Build Itinerary",
    description: "Day-by-day AI plan with map",
  },
  {
    path: "expenses",
    icon: "💸",
    title: "Track Expenses",
    description: "Split and settle via UPI",
  },
];

const stageIndex: Record<TripStatus, number> = {
  gathering_inputs: 0,
  voting: 1,
  planning: 2,
  active: 3,
  completed: 3,
};

export function TripDashboard({ slug, trip, members, currentUserId }: Props) {
  const storeMembers = useTripStore((s) => s.members);
  const displayMembers = storeMembers.length > 0 ? storeMembers : members;
  const currentStage = stageIndex[trip.status];

  function handleWhatsAppShare() {
    const url = `${window.location.origin}/t/${slug}`;
    const msg = `Hey! I'm planning ${trip.name} and need your input. Takes 2 minutes 👇\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  const budgetStr =
    trip.budget_min && trip.budget_max
      ? `₹${(trip.budget_min / 1000).toFixed(0)}K–₹${(trip.budget_max / 1000).toFixed(0)}K`
      : null;

  const dateStr =
    trip.confirmed_start && trip.confirmed_end
      ? `${new Date(trip.confirmed_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(trip.confirmed_end).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
      : null;

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{trip.name}</h1>
            {trip.destination && (
              <p className="text-sm text-orange-500 mt-0.5">📍 {trip.destination}</p>
            )}
          </div>
          <StatusBadge status={trip.status} />
        </div>

        {/* Stage progress bar */}
        <div className="flex gap-1.5 mt-4">
          {STAGES.map((stage, i) => (
            <div key={stage.key} className="flex-1 flex flex-col gap-1">
              <motion.div
                className={`h-1.5 rounded-full ${
                  i < currentStage
                    ? "bg-green-400"
                    : i === currentStage
                    ? "bg-orange-400"
                    : "bg-gray-200"
                }`}
                animate={
                  i === currentStage
                    ? { opacity: [1, 0.6, 1] }
                    : {}
                }
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-[9px] text-gray-400 text-center">{stage.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {/* Members */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Members</p>
          <MemberAvatarRow members={displayMembers as any} max={5} size="sm" />
          <p className="text-sm font-semibold text-gray-900 mt-2">
            {displayMembers.length} joined
          </p>
        </div>

        {/* Budget overlap */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Budget overlap</p>
          {budgetStr ? (
            <p className="text-lg font-bold text-green-600">{budgetStr}</p>
          ) : (
            <p className="text-sm text-gray-400">Gathering...</p>
          )}
          <p className="text-xs text-gray-400 mt-1">per person</p>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Dates</p>
          {dateStr ? (
            <p className="text-sm font-semibold text-gray-900">{dateStr}</p>
          ) : (
            <p className="text-sm text-gray-400">Not locked yet</p>
          )}
        </div>

        {/* Vibes */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Vibes</p>
          {trip.vibes.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {trip.vibes.slice(0, 3).map((v) => (
                <span key={v} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                  {v}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Gathering...</p>
          )}
        </div>
      </div>

      {/* Step cards */}
      <div className="flex flex-col gap-2 px-4 pb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Plan your trip
        </h2>
        {STATUS_STEPS.map((step) => (
          <Link
            key={step.path}
            href={`/t/${slug}/${step.path}`}
            className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4 active:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">{step.icon}</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
              <p className="text-xs text-gray-400">{step.description}</p>
            </div>
            <span className="text-gray-300 text-lg">›</span>
          </Link>
        ))}
      </div>

      {/* Share CTA */}
      <div className="px-4 pb-4">
        <button
          onClick={handleWhatsAppShare}
          className="w-full py-3.5 rounded-2xl text-white font-medium flex items-center justify-center gap-2 text-sm"
          style={{ backgroundColor: "#25D366" }}
        >
          <span>💬</span> Share link with group
        </button>
      </div>
    </div>
  );
}
