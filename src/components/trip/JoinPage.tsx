"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Props {
  slug: string;
  tripName: string;
  memberCount: number;
  destination: string | null;
}

export function JoinPage({ slug, tripName, memberCount, destination }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleJoin() {
    setLoading(true);
    const res = await fetch("/api/trips/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Could not join trip");
      return;
    }

    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6 text-center"
      >
        <div className="text-5xl">✈️</div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tripName}</h1>
          {destination && (
            <p className="text-orange-500 font-medium mt-1">📍 {destination}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {memberCount} {memberCount === 1 ? "person is" : "people are"} already planning this trip
          </p>
        </div>

        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-semibold text-base disabled:opacity-50"
          style={{ backgroundColor: "#25D366" }}
        >
          {loading ? "Joining..." : "Join this trip →"}
        </button>

        <p className="text-xs text-gray-400">
          You&apos;ll vote on dates, budget, and destination
        </p>
      </motion.div>
    </div>
  );
}
