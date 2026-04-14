"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { parseISO, format, differenceInDays, eachDayOfInterval, getDay } from "date-fns";
import { useTripStore } from "@/store/tripStore";
import { createClient } from "@/lib/supabase/client";
import { DateGrid } from "@/components/dates/DateGrid";
import { BestDatesSummary } from "@/components/dates/BestDatesSummary";
import { DateLockButton } from "@/components/dates/DateLockButton";
import { SetDateWindow } from "@/components/dates/SetDateWindow";
import { DatesLoader } from "@/components/dates/DatesLoader";

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
  const [saved, setSaved] = useState(false);
  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [allVotes, setAllVotes] = useState<VoteRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [myDates, setMyDates] = useState<Set<string>>(new Set());
  const [pulsingDates, setPulsingDates] = useState<Set<string>>(new Set());

  const supabase = createClient();
  const broadcastRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const minDelay = new Promise((r) => setTimeout(r, 1500));

    Promise.all([
      fetch(`/api/trips/${slug}/dates`).then((r) => r.json()),
      minDelay,
    ])
      .then(([data]) => {
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
        setSaved(mine.size > 0);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Could not load dates");
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

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
    setSaved(false);
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

  function handleSelectAll() {
    if (!trip?.date_window_start || !trip?.date_window_end) return;
    setSaved(false);
    const all = eachDayOfInterval({
      start: parseISO(trip.date_window_start),
      end: parseISO(trip.date_window_end),
    }).map((d) => format(d, "yyyy-MM-dd"));
    setMyDates(new Set(all));
  }

  function handleSelectWeekdays() {
    if (!trip?.date_window_start || !trip?.date_window_end) return;
    setSaved(false);
    const weekdays = eachDayOfInterval({
      start: parseISO(trip.date_window_start),
      end: parseISO(trip.date_window_end),
    })
      .filter((d) => getDay(d) >= 1 && getDay(d) <= 5)
      .map((d) => format(d, "yyyy-MM-dd"));
    setMyDates(new Set(weekdays));
  }

  function handleSelectWeekends() {
    if (!trip?.date_window_start || !trip?.date_window_end) return;
    setSaved(false);
    const weekends = eachDayOfInterval({
      start: parseISO(trip.date_window_start),
      end: parseISO(trip.date_window_end),
    })
      .filter((d) => getDay(d) === 0 || getDay(d) === 6)
      .map((d) => format(d, "yyyy-MM-dd"));
    setMyDates(new Set(weekends));
  }

  function handleClear() {
    setSaved(false);
    setMyDates(new Set());
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
    setSaved(true);
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

  if (loading) return <DatesLoader />;

  if (!trip || !trip.date_window_start || !trip.date_window_end) {
    return (
      <SetDateWindow
        slug={slug}
        isOrganizer={userRole === "organizer"}
        onSet={(start, end) => {
          setTrip((prev) =>
            prev
              ? { ...prev, date_window_start: start, date_window_end: end }
              : { id: "", date_window_start: start, date_window_end: end, confirmed_start: null, confirmed_end: null, status: "gathering_inputs" }
          );
        }}
      />
    );
  }

  const windowStart = parseISO(trip.date_window_start);
  const windowEnd = parseISO(trip.date_window_end);
  const heatmap = computeHeatmap(allVotes);
  const votedUserIds = new Set(allVotes.map((v) => v.user_id));
  const threshold = Math.max(1, Math.ceil(members.length * 0.5));
  const bestRanges = findBestRanges(heatmap, threshold);
  const isLocked = !!trip.confirmed_start;

  const QUICK_CHIPS = [
    { label: "All days", icon: "✅", action: handleSelectAll },
    { label: "Weekdays", icon: "💼", action: handleSelectWeekdays },
    { label: "Weekend", icon: "🎉", action: handleSelectWeekends },
    { label: "Clear", icon: "✕", action: handleClear },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 100 }}>

      {/* Header */}
      <div style={{
        padding: "24px 20px 20px",
        background: "rgba(255,255,255,0.95)",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-playfair)",
              fontSize: 22, fontWeight: 800,
              color: "var(--tb-text)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>📅</span> When can everyone go?
            </h1>
            <p style={{ fontSize: 13, color: "var(--tb-orange)", marginTop: 4, fontWeight: 500 }}>
              📅 {format(windowStart, "d MMM")} – {format(windowEnd, "d MMM yyyy")} window
            </p>
          </div>
          {isLocked && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100,
              background: "rgba(37,211,102,0.1)", color: "#25D366",
            }}>
              Locked ✓
            </span>
          )}
        </div>

        {/* Anonymous toggle */}
        {userRole === "organizer" && !isLocked && (
          <button
            onClick={handleToggleAnonymous}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)",
              borderRadius: 12, padding: "10px 12px", cursor: "pointer",
              fontFamily: "var(--font-sans)", width: "100%",
            }}
          >
            <div style={{
              width: 36, height: 20, borderRadius: 100,
              background: isAnonymous ? "var(--tb-orange)" : "rgba(0,0,0,0.12)",
              position: "relative", flexShrink: 0, transition: "background 0.2s",
            }}>
              <div style={{
                position: "absolute", top: 2, width: 16, height: 16,
                borderRadius: "50%", background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transform: isAnonymous ? "translateX(18px)" : "translateX(2px)",
                transition: "transform 0.2s",
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--tb-text)" }}>
              Anonymous mode
            </span>
            <span style={{ fontSize: 12, color: "var(--tb-light)", marginLeft: "auto" }}>
              {isAnonymous ? "Names hidden" : "Names visible"}
            </span>
          </button>
        )}
      </div>

      {/* Quick-select chips */}
      {!isLocked && (
        <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={chip.action}
              style={{
                padding: "12px 6px",
                borderRadius: 14,
                border: "1.5px solid rgba(0,0,0,0.07)",
                background: "#fff",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                cursor: "pointer", transition: "all 0.15s ease",
                fontFamily: "var(--font-sans)",
              }}
            >
              <span style={{ fontSize: 16 }}>{chip.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--tb-muted)" }}>{chip.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* "I'm free all days" button */}
      {!isLocked && (
        <div style={{ padding: "0 20px" }}>
          <button
            onClick={handleSelectAll}
            style={{
              width: "100%", padding: "14px 18px",
              borderRadius: 16,
              background: "rgba(0,0,0,0.03)",
              border: "1.5px solid rgba(0,0,0,0.06)",
              fontSize: 13, fontWeight: 600, color: "var(--tb-muted)",
              cursor: "pointer", fontFamily: "var(--font-sans)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <span>🎉</span> I&apos;m free all days — you guys decide
          </button>
        </div>
      )}

      {/* Date cards label */}
      <div style={{ padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tb-muted)" }}>
          👆 Tap the days you&apos;re free
        </span>
        <span style={{ fontSize: 11, color: "var(--tb-light)" }}>← swipe →</span>
      </div>

      {/* Horizontal date cards */}
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

      {/* Selected count badge */}
      {!isLocked && myDates.size > 0 && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{
            fontSize: 12, fontWeight: 600,
            padding: "5px 14px", borderRadius: 100,
            background: "rgba(255,107,53,0.08)",
            color: "var(--tb-orange)",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--tb-orange)", display: "inline-block" }} />
            {myDates.size} {myDates.size === 1 ? "day" : "days"} selected
          </span>
        </div>
      )}

      {/* Availability summary */}
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

      {/* Save button */}
      {!isLocked && (
        <div style={{ padding: "0 20px" }}>
          <motion.button
            onClick={saved ? undefined : handleSave}
            disabled={saving || myDates.size === 0}
            whileTap={saved ? {} : { scale: 0.97 }}
            style={{
              width: "100%", padding: "16px",
              borderRadius: 18,
              border: "none",
              background: saved
                ? "rgba(0,0,0,0.05)"
                : "linear-gradient(135deg, #25D366 0%, #2EE07A 100%)",
              color: saved ? "var(--tb-muted)" : "#fff",
              fontSize: 15, fontWeight: 700,
              cursor: saved ? "default" : myDates.size === 0 ? "default" : "pointer",
              fontFamily: "var(--font-sans)",
              boxShadow: saved ? "none" : "0 4px 16px rgba(37,211,102,0.25)",
              transition: "all 0.2s ease",
              opacity: myDates.size === 0 && !saved ? 0.45 : 1,
            }}
          >
            {saving
              ? "Saving..."
              : saved
                ? `✅ Availability saved (${myDates.size} ${myDates.size === 1 ? "day" : "days"})`
                : `Save my availability (${myDates.size} ${myDates.size === 1 ? "day" : "days"})`}
          </motion.button>
          {!saved && myDates.size > 0 && (
            <p style={{ fontSize: 11, color: "var(--tb-light)", textAlign: "center", marginTop: 6 }}>
              Choose the best window. This advances to destination voting.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
