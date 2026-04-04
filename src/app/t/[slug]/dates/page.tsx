"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { parseISO, format, differenceInDays } from "date-fns";
import { useTripStore } from "@/store/tripStore";
import { createClient } from "@/lib/supabase/client";
import { DateGrid } from "@/components/dates/DateGrid";
import { BestDatesSummary } from "@/components/dates/BestDatesSummary";
import { DateLockButton } from "@/components/dates/DateLockButton";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

interface VoteRow {
  user_id: string;
  date: string;
  is_available: boolean;
}

interface Member {
  user_id: string;
  role: string;
}

interface TripInfo {
  id: string;
  date_window_start: string | null;
  date_window_end: string | null;
  confirmed_start: string | null;
  confirmed_end: string | null;
  status: string;
}

function computeHeatmap(votes: VoteRow[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const v of votes) {
    if (v.is_available) {
      map[v.date] = (map[v.date] ?? 0) + 1;
    }
  }
  return map;
}

function findBestRanges(heatmap: Record<string, number>, minCount: number) {
  const dates = Object.entries(heatmap)
    .filter(([, c]) => c >= minCount)
    .map(([d]) => d)
    .sort();

  if (dates.length === 0) return [];

  const ranges: { start: string; end: string; count: number }[] = [];
  let rangeStart = dates[0];
  let prev = dates[0];
  let minInRange = heatmap[dates[0]];

  for (let i = 1; i < dates.length; i++) {
    const curr = dates[i];
    const diff = differenceInDays(parseISO(curr), parseISO(prev));
    if (diff === 1) {
      minInRange = Math.min(minInRange, heatmap[curr]);
      prev = curr;
    } else {
      ranges.push({ start: rangeStart, end: prev, count: minInRange });
      rangeStart = curr;
      prev = curr;
      minInRange = heatmap[curr];
    }
  }
  ranges.push({ start: rangeStart, end: prev, count: minInRange });

  return ranges.sort((a, b) => b.count - a.count).slice(0, 3);
}

export default function DatesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const tripId = useTripStore((s) => s.tripId);
  const currentUserId = useTripStore((s) => s.currentUserId);
  const userRole = useTripStore((s) => s.userRole);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [allVotes, setAllVotes] = useState<VoteRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [myDates, setMyDates] = useState<Set<string>>(new Set());
  const [pulsingDates, setPulsingDates] = useState<Set<string>>(new Set());

  const supabase = createClient();
  const broadcastRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load initial data
  useEffect(() => {
    fetch(`/api/trips/${slug}/dates`)
      .then((r) => r.json())
      .then((data) => {
        setTrip(data.trip);
        setAllVotes(data.votes);
        setMembers(data.members);
        setIsAnonymous(data.config?.is_anonymous ?? false);

        const mine = new Set<string>(
          data.votes
            .filter((v: VoteRow) => v.user_id === currentUserId && v.is_available)
            .map((v: VoteRow) => v.date)
        );
        setMyDates(mine);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Could not load dates");
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Realtime: Postgres Changes for votes + Broadcast for pulse animations
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`trip:${slug}:dates`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "date_votes", filter: `trip_id=eq.${tripId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newVote = payload.new as VoteRow;
            setAllVotes((prev) => {
              const filtered = prev.filter(
                (v) => !(v.user_id === newVote.user_id && v.date === newVote.date)
              );
              return [...filtered, newVote];
            });
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as VoteRow;
            setAllVotes((prev) =>
              prev.filter((v) => !(v.user_id === old.user_id && v.date === old.date))
            );
          }
        }
      )
      .on(
        "broadcast",
        { event: "date-pulse" },
        (payload: { payload: { date: string } }) => {
          const date = payload.payload?.date;
          if (!date) return;
          setPulsingDates((prev) => new Set([...prev, date]));
          setTimeout(() => {
            setPulsingDates((prev) => {
              const next = new Set(prev);
              next.delete(date);
              return next;
            });
          }, 500);
        }
      )
      .subscribe();

    broadcastRef.current = channel;
    return () => { channel.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, slug]);

  function handleToggle(date: string) {
    setMyDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
        broadcastRef.current?.send({
          type: "broadcast",
          event: "date-pulse",
          payload: { date },
        });
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/trips/${slug}/dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dates: Array.from(myDates) }),
    });

    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save. Try again.");
      return;
    }
    toast.success("Availability saved!");
  }

  async function handleToggleAnonymous() {
    const newVal = !isAnonymous;
    setIsAnonymous(newVal);
    await fetch(`/api/trips/${slug}/dates`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_anonymous: newVal }),
    });
  }

  if (loading) return <PageSkeleton />;

  if (!trip || !trip.date_window_start || !trip.date_window_end) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 mt-8 text-sm">No date window set for this trip yet.</p>
      </div>
    );
  }

  const windowStart = parseISO(trip.date_window_start);
  const windowEnd = parseISO(trip.date_window_end);
  const heatmap = computeHeatmap(allVotes);
  const votedUserIds = new Set(allVotes.map((v) => v.user_id));
  const threshold = Math.max(1, Math.ceil(members.length * 0.5));
  const bestRanges = findBestRanges(heatmap, threshold);
  const isLocked = !!trip.confirmed_start;

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div
        className="px-4 pt-6 pb-4"
        style={{ background: "rgba(255,255,255,0.9)", borderBottom: "1px solid rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: "var(--tb-text)" }}>
              When can everyone go?
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--tb-light)" }}>
              {format(windowStart, "d MMM")} – {format(windowEnd, "d MMM yyyy")} window
            </p>
          </div>
          {isLocked && (
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(37,211,102,0.1)", color: "#25D366" }}
            >
              Locked ✓
            </span>
          )}
        </div>

        {userRole === "organizer" && !isLocked && (
          <button
            onClick={handleToggleAnonymous}
            className="mt-3 flex items-center gap-2 text-[13px]"
            style={{ color: "var(--tb-muted)" }}
          >
            <div
              className="w-9 h-5 rounded-full transition-colors relative"
              style={{ background: isAnonymous ? "var(--tb-orange)" : "rgba(0,0,0,0.12)" }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: isAnonymous ? "translateX(16px)" : "translateX(2px)" }}
              />
            </div>
            <span>Anonymous mode</span>
          </button>
        )}
      </div>

      {/* Date grid */}
      <DateGrid
        windowStart={windowStart}
        windowEnd={windowEnd}
        myDates={isLocked ? new Set<string>() : myDates}
        heatmap={heatmap}
        totalMembers={members.length}
        isAnonymous={isAnonymous}
        pulsingDates={pulsingDates}
        onToggle={isLocked ? () => {} : handleToggle}
      />

      {/* Best dates summary */}
      <BestDatesSummary
        heatmap={heatmap}
        totalMembers={members.length}
        members={members}
        votedUserIds={votedUserIds}
        currentUserId={currentUserId ?? ""}
      />

      {/* Organizer lock */}
      {userRole === "organizer" && !isLocked && bestRanges.length > 0 && (
        <DateLockButton
          slug={slug}
          bestRanges={bestRanges}
          totalMembers={members.length}
          onLocked={(start, end) => {
            setTrip((prev) =>
              prev ? { ...prev, confirmed_start: start, confirmed_end: end, status: "voting" } : prev
            );
          }}
        />
      )}

      {/* Save */}
      {!isLocked && (
        <div className="px-4">
          <motion.button
            onClick={handleSave}
            disabled={saving || myDates.size === 0}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-[18px] text-white font-bold text-[16px] disabled:opacity-50 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
            style={{
              background: "linear-gradient(135deg, #25D366 0%, #2EE07A 100%)",
              boxShadow: "0 4px 16px rgba(37,211,102,0.25)",
            }}
          >
            {saving
              ? "Saving..."
              : `Save my availability (${myDates.size} ${myDates.size === 1 ? "day" : "days"})`}
          </motion.button>
        </div>
      )}
    </div>
  );
}
