"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTripStore } from "@/store/tripStore";
import { MemberAvatarRow } from "@/components/shared/MemberAvatarRow";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TRIP_STEPS } from "@/lib/tripProgress";
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

/**
 * Keyed off which step the group is on, not trips.status: nothing in the app
 * ever advances the status past "planning", so a status-driven message would
 * never reach its later states.
 */
function getEmotionalMessage(memberCount: number, currentStepIndex: number) {
  if (currentStepIndex === 0) {
    if (memberCount <= 1) return { emoji: "👀", text: "Just you so far — invite the squad!", color: "#FF6B35", anim: "animate-waveHand" };
    if (memberCount <= 3) return { emoji: "🔥", text: `${memberCount} friends in, keep sharing!`, color: "#F59E0B", anim: "" };
    if (memberCount <= 5) return { emoji: "🙌", text: `${memberCount} friends ready, almost there!`, color: "#00A8A8", anim: "" };
    return { emoji: "🚀", text: `${memberCount} friends locked in, let's gooo!`, color: "#25D366", anim: "" };
  }
  if (currentStepIndex === 1) return { emoji: "💰", text: "Collecting everyone's budget...", color: "#00A8A8", anim: "" };
  if (currentStepIndex === 2) return { emoji: "🗳️", text: "Votes are coming in...", color: "#8B5CF6", anim: "" };
  if (currentStepIndex === 3) return { emoji: "✨", text: "Time to build the plan...", color: "#10B981", anim: "" };
  return { emoji: "🎉", text: "Trip is live! Have fun!", color: "#25D366", anim: "" };
}

export function TripDashboard({ slug, trip, members, currentUserId }: Props) {
  const storeMembers = useTripStore((s) => s.members);
  const stepStates = useTripStore((s) => s.stepStates);
  const displayMembers = storeMembers.length > 0 ? storeMembers : members;
  const currentStepIndex = Math.max(
    0,
    TRIP_STEPS.findIndex((s) => stepStates[s.path] === "current")
  );
  const [copied, setCopied] = useState(false);
  const [hoveredStep, setHoveredStep] = useState(-1);
  const [shareUrl, setShareUrl] = useState(`/t/${slug}`);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/t/${slug}`);
  }, [slug]);

  function handleCopy() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/t/${slug}` : "";
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleWhatsAppShare() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/t/${slug}` : "";
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

  const emotional = getEmotionalMessage(displayMembers.length, currentStepIndex);

  const compactStats = [
    { icon: "👥", label: "Members", value: `${displayMembers.length}`, hasData: true },
    { icon: "💰", label: "Budget",  value: budgetStr ?? "—",           hasData: !!budgetStr },
    { icon: "📅", label: "Dates",   value: dateStr ?? "—",             hasData: !!dateStr },
    { icon: "✨", label: "Vibes",   value: trip.vibes[0] ?? "—",       hasData: trip.vibes.length > 0 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--tb-cream)", fontFamily: "var(--font-sans)" }}>

      {/* ── HERO HEADER (full-width white section) ── */}
      <div
        className="animate-fadeUp"
        style={{
          background: "linear-gradient(145deg, #fff 0%, #FEFCF9 100%)",
          padding: "20px 16px 18px",
          borderBottom: "1px solid rgba(0,0,0,0.04)",
          display: "flex", flexDirection: "column", gap: 14,
        }}
      >
        {/* Trip name + status badge */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: 24, fontWeight: 800,
                color: "var(--tb-text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {trip.name}
            </h1>
            {trip.destination && (
              <p style={{ fontSize: 12, color: "var(--tb-orange)", marginTop: 2 }}>
                📍 {trip.destination}
              </p>
            )}
          </div>
          <StatusBadge status={trip.status} />
        </div>

        {/* The five-step tracker lives in the trip layout now, so it stays
            visible on every page instead of only here. */}

        {/* Emotional status */}
        <div
          className="animate-fadeIn"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 14,
            background: `${emotional.color}08`,
            border: `1px solid ${emotional.color}15`,
          }}
        >
          <span className={`text-xl ${emotional.anim}`} style={{ display: "inline-block" }}>
            {emotional.emoji}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: emotional.color }}>
            {emotional.text}
          </span>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 16px 100px" }}>

        {/* Invite CTA */}
        <div
          className="animate-fadeUp"
          style={{
            borderRadius: 22, padding: 20,
            background: "linear-gradient(145deg, #fff 0%, #FEFCF9 100%)",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            display: "flex", flexDirection: "column", gap: 14,
            animationDelay: "0.1s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: "rgba(37,211,102,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>📢</div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "var(--tb-text)" }}>Invite your group</p>
              <p style={{ fontSize: 12, color: "var(--tb-muted)" }}>They&apos;ll vote on dates &amp; budget in 2 min</p>
            </div>
          </div>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 12px", borderRadius: 12, width: "100%", textAlign: "left",
              background: copied ? "rgba(37,211,102,0.06)" : "rgba(0,0,0,0.02)",
              border: `1px solid ${copied ? "rgba(37,211,102,0.15)" : "rgba(0,0,0,0.04)"}`,
              cursor: "pointer", transition: "all 0.2s ease",
              fontFamily: "var(--font-sans)",
            }}
          >
            <span style={{ fontSize: 14 }}>🔗</span>
            <span style={{
              flex: 1, fontSize: 12, color: "var(--tb-muted)", fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{shareUrl}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, flexShrink: 0,
              color: copied ? "#25D366" : "var(--tb-orange)",
              padding: "3px 8px", borderRadius: 6,
              background: copied ? "rgba(37,211,102,0.08)" : "rgba(255,107,53,0.08)",
            }}>{copied ? "✓ Copied" : "Copy"}</span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={handleWhatsAppShare}
            style={{
              width: "100%", padding: "15px 20px",
              borderRadius: 16, border: "none",
              background: "linear-gradient(135deg, #25D366 0%, #2EE07A 100%)",
              color: "#fff", fontSize: 15, fontWeight: 700,
              fontFamily: "var(--font-sans)", cursor: "pointer",
              boxShadow: "0 3px 12px rgba(37,211,102,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(37,211,102,0.3)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 3px 12px rgba(37,211,102,0.25)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Share on WhatsApp
          </button>
        </div>

        {/* Compact stats row */}
        <div
          className="animate-fadeUp"
          style={{
            borderRadius: 18, overflow: "hidden",
            background: "linear-gradient(145deg, #fff 0%, #FEFCF9 100%)",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            display: "flex",
            animationDelay: "0.15s",
          }}
        >
          {compactStats.map((item, i) => (
            <div
              key={item.label}
              style={{
                flex: 1, padding: "12px 6px",
                textAlign: "center",
                borderRight: i < compactStats.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.hasData ? (
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tb-text)", lineHeight: 1.2, textAlign: "center" }}>
                  {item.value}
                </span>
              ) : (
                <span
                  className="animate-shimmer"
                  style={{
                    display: "inline-block", width: 24, height: 10, borderRadius: 3,
                    background: "rgba(0,0,0,0.06)",
                  }}
                />
              )}
              <span style={{ fontSize: 9.5, color: "var(--tb-light)", fontWeight: 500 }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Member avatars */}
        <div
          className="animate-fadeIn"
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px", borderRadius: 16,
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(0,0,0,0.04)",
            animationDelay: "0.2s",
          }}
        >
          <MemberAvatarRow members={displayMembers as Parameters<typeof MemberAvatarRow>[0]["members"]} max={6} size="sm" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tb-text)" }}>
            {displayMembers.length} {displayMembers.length === 1 ? "member" : "members"} joined
          </span>
        </div>

        {/* Progress checklist */}
        <div className="animate-fadeUp" style={{ display: "flex", flexDirection: "column", gap: 6, animationDelay: "0.25s" }}>
          <h2 style={{
            fontSize: 11, fontWeight: 700, color: "var(--tb-light)",
            textTransform: "uppercase", letterSpacing: "0.06em",
            display: "flex", alignItems: "center", gap: 6,
            marginBottom: 2, paddingLeft: 2,
          }}>
            <span style={{ fontSize: 13 }}>🗺️</span> Your trip journey
          </h2>

          {TRIP_STEPS.map((step, i) => {
            // Every step stays reachable. Pages own their empty states, and a
            // dead-end link is how people conclude the app is broken.
            const stepStatus = stepStates[step.path] ?? "upcoming";
            const isCurrent = stepStatus === "current";
            const isDone = stepStatus === "done";
            const isHovered = hoveredStep === i;

            return (
              <Link
                key={step.path}
                href={`/t/${slug}/${step.path}`}
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(-1)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: isCurrent ? "14px 14px" : "11px 14px",
                  borderRadius: isCurrent ? 18 : 14,
                  background: isCurrent
                    ? "linear-gradient(145deg, #fff 0%, #FEFCF9 100%)"
                    : isHovered
                      ? "rgba(255,255,255,0.7)"
                      : "transparent",
                  border: isCurrent ? `1.5px solid ${step.color}25` : "1.5px solid transparent",
                  boxShadow: isCurrent ? `0 4px 16px ${step.color}08` : "none",
                  cursor: "pointer",
                  transform: isHovered ? "translateX(3px)" : "translateX(0)",
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                  position: "relative",
                  textDecoration: "none",
                }}
              >
                {/* Timeline connector */}
                {i < TRIP_STEPS.length - 1 && (
                  <div style={{
                    position: "absolute",
                    left: 31, top: isCurrent ? 48 : 40,
                    width: 2, height: isCurrent ? 14 : 10,
                    background: isDone ? "rgba(37,211,102,0.3)" : "rgba(0,0,0,0.06)",
                    borderRadius: 2,
                  }} />
                )}

                {/* Icon */}
                <div style={{
                  width: isCurrent ? 40 : 34, height: isCurrent ? 40 : 34,
                  borderRadius: isCurrent ? 13 : 10, flexShrink: 0,
                  background: isDone
                    ? "rgba(37,211,102,0.12)"
                    : isCurrent
                      ? `linear-gradient(135deg, ${step.color}15, ${step.color}08)`
                      : "rgba(0,0,0,0.025)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: isCurrent ? 20 : 17,
                  transform: isHovered ? "scale(1.08)" : "scale(1)",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}>
                  {step.icon}
                  {isDone && (
                    <div style={{
                      position: "absolute", bottom: -2, right: -2,
                      width: 14, height: 14, borderRadius: "50%",
                      background: "#25D366", border: "2px solid white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{
                      fontSize: isCurrent ? 14 : 13,
                      fontWeight: isCurrent ? 700 : 600,
                      color: "var(--tb-text)",
                    }}>{step.title}</p>
                    {isCurrent && (
                      <span
                        className="animate-pulse"
                        style={{
                          fontSize: 9, fontWeight: 700, color: step.color,
                          padding: "2px 7px", borderRadius: 6,
                          background: `${step.color}10`,
                          textTransform: "uppercase", letterSpacing: "0.04em",
                        }}
                      >Next</span>
                    )}
                  </div>
                  {isCurrent && (
                    <p style={{ fontSize: 12, color: "var(--tb-muted)", marginTop: 2 }}>{step.desc}</p>
                  )}
                </div>

                {/* Right side */}
                <div style={{ flexShrink: 0 }}>
                  {isDone ? (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#25D366" }}>✓ Done</span>
                  ) : isCurrent ? (
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: step.color,
                      padding: "3px 8px", borderRadius: 6,
                      background: `${step.color}08`,
                    }}>Go →</span>
                  ) : (
                    <span style={{ fontSize: 13, color: "var(--tb-light)" }}>›</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
