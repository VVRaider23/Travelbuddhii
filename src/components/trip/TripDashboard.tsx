"use client";

import Link from "next/link";
import { useState } from "react";
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

const STAGES: { key: TripStatus; label: string; icon: string; color: string }[] = [
  { key: "gathering_inputs", label: "Gathering", icon: "📩", color: "#FF6B35" },
  { key: "voting",           label: "Voting",    icon: "🗳️", color: "#8B5CF6" },
  { key: "planning",         label: "Planning",  icon: "✨", color: "#00A8A8" },
  { key: "active",           label: "Active",    icon: "🚀", color: "#25D366" },
];

const STEPS = [
  { path: "dates",        icon: "📅", title: "Pick Dates",          desc: "Vote on when everyone's free",     color: "#FF6B35" },
  { path: "budget",       icon: "💰", title: "Budget + Vibe",       desc: "Set your range (stays private)",   color: "#00A8A8" },
  { path: "destinations", icon: "🗺️", title: "Choose Destination",  desc: "AI suggests, group votes",         color: "#8B5CF6" },
  { path: "itinerary",    icon: "✈️", title: "Build Itinerary",     desc: "Day-by-day AI plan with map",      color: "#10B981" },
  { path: "expenses",     icon: "💸", title: "Track Expenses",      desc: "Split and settle via UPI",         color: "#EC4899" },
];

const stageIndex: Record<TripStatus, number> = {
  gathering_inputs: 0,
  voting: 1,
  planning: 2,
  active: 3,
  completed: 3,
};

type StepStatus = "done" | "current" | "upcoming" | "locked";

function getStepStatus(path: string, trip: TripData): StepStatus {
  const s = trip.status;
  switch (path) {
    case "dates":
      if (trip.confirmed_start) return "done";
      return s === "gathering_inputs" ? "current" : "upcoming";
    case "budget":
      if (trip.budget_min) return "done";
      return s === "gathering_inputs" ? "upcoming" : "current";
    case "destinations":
      if (trip.destination) return "done";
      if (s === "gathering_inputs" || s === "voting") return "upcoming";
      return "current";
    case "itinerary":
      if (!trip.destination) return "locked";
      if (s === "active" || s === "completed") return "done";
      if (s === "planning") return "current";
      return "upcoming";
    case "expenses":
      if (s === "active" || s === "completed") return "current";
      return "locked";
    default:
      return "upcoming";
  }
}

function getEmotionalMessage(memberCount: number, stage: number) {
  if (stage === 0) {
    if (memberCount <= 1) return { emoji: "👀", text: "Just you so far — invite the squad!", color: "#FF6B35", anim: "animate-waveHand" };
    if (memberCount <= 3) return { emoji: "🔥", text: `${memberCount} friends in, keep sharing!`, color: "#F59E0B", anim: "" };
    if (memberCount <= 5) return { emoji: "🙌", text: `${memberCount} friends ready, almost there!`, color: "#00A8A8", anim: "" };
    return { emoji: "🚀", text: `${memberCount} friends locked in, let's gooo!`, color: "#25D366", anim: "" };
  }
  if (stage === 1) return { emoji: "🗳️", text: "Votes are coming in...", color: "#8B5CF6", anim: "" };
  if (stage === 2) return { emoji: "✨", text: "AI is cooking your plan...", color: "#00A8A8", anim: "" };
  return { emoji: "🎉", text: "Trip is live! Have fun!", color: "#25D366", anim: "" };
}

export function TripDashboard({ slug, trip, members, currentUserId }: Props) {
  const storeMembers = useTripStore((s) => s.members);
  const displayMembers = storeMembers.length > 0 ? storeMembers : members;
  const currentStage = stageIndex[trip.status];
  const [copied, setCopied] = useState(false);
  const [hoveredStep, setHoveredStep] = useState(-1);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/t/${slug}`
    : `/t/${slug}`;

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

  const emotional = getEmotionalMessage(displayMembers.length, currentStage);

  const compactStats = [
    { icon: "👥", label: "Members",  value: `${displayMembers.length}`,    hasData: true },
    { icon: "💰", label: "Budget",   value: budgetStr ?? "—",               hasData: !!budgetStr },
    { icon: "📅", label: "Dates",    value: dateStr ?? "—",                 hasData: !!dateStr },
    { icon: "✨", label: "Vibes",    value: trip.vibes[0] ?? "—",           hasData: trip.vibes.length > 0 },
  ];

  return (
    <div
      className="flex flex-col gap-4 pb-8 pt-4 px-4"
      style={{ background: "var(--tb-cream)", minHeight: "100vh" }}
    >
      {/* Trip name + status */}
      <div className="flex items-start justify-between animate-fadeUp">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: "var(--tb-text)" }}>
            {trip.name}
          </h1>
          {trip.destination && (
            <p className="text-sm mt-0.5" style={{ color: "var(--tb-orange)" }}>
              📍 {trip.destination}
            </p>
          )}
        </div>
        <StatusBadge status={trip.status} />
      </div>

      {/* Progress bar */}
      <div
        className="rounded-[18px] p-4 animate-fadeUp"
        style={{
          background: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          animationDelay: "0.05s",
        }}
      >
        <div className="flex items-center gap-2">
          {STAGES.map((stage, i) => {
            const done = i < currentStage;
            const current = i === currentStage;
            return (
              <div key={stage.key} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={current ? "animate-progressPulse" : ""}
                  style={{
                    width: "100%", height: 5, borderRadius: 100,
                    background: done
                      ? "linear-gradient(90deg, #25D366, #2EE07A)"
                      : current
                        ? `linear-gradient(90deg, ${stage.color}, ${stage.color}90)`
                        : "rgba(0,0,0,0.06)",
                  }}
                />
                <div
                  className="flex items-center gap-1 text-[10px]"
                  style={{
                    fontWeight: current ? 600 : 500,
                    color: current ? stage.color : done ? "#25D366" : "var(--tb-light)",
                  }}
                >
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="#25D366">
                      <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.41 5.29a.75.75 0 00-1.06-1.06L7 7.59 5.65 6.24a.75.75 0 10-1.06 1.06l1.88 1.88a.75.75 0 001.06 0l3.88-3.89z"/>
                    </svg>
                  )}
                  {current && <span className="text-[10px]">{stage.icon}</span>}
                  {stage.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emotional status */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-fadeIn"
        style={{
          background: `${emotional.color}08`,
          border: `1px solid ${emotional.color}15`,
          animationDelay: "0.1s",
        }}
      >
        <span className={`text-xl ${emotional.anim}`}>{emotional.emoji}</span>
        <span className="text-sm font-semibold" style={{ color: emotional.color }}>
          {emotional.text}
        </span>
      </div>

      {/* Invite CTA */}
      <div
        className="rounded-[22px] p-5 flex flex-col gap-3.5 animate-fadeUp"
        style={{
          background: "linear-gradient(145deg, #fff 0%, #FEFCF9 100%)",
          border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          animationDelay: "0.15s",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: "rgba(37,211,102,0.12)" }}
          >
            📢
          </div>
          <div>
            <p className="text-[15px] font-bold" style={{ color: "var(--tb-text)" }}>Invite your group</p>
            <p className="text-[12px]" style={{ color: "var(--tb-muted)" }}>They'll vote on dates & budget in 2 min</p>
          </div>
        </div>

        {/* Copy link row */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl w-full text-left transition-all"
          style={{
            background: copied ? "rgba(37,211,102,0.06)" : "rgba(0,0,0,0.02)",
            border: `1px solid ${copied ? "rgba(37,211,102,0.15)" : "rgba(0,0,0,0.04)"}`,
          }}
        >
          <span className="text-sm">🔗</span>
          <span
            className="flex-1 text-xs font-medium overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ color: "var(--tb-muted)" }}
          >
            {shareUrl}
          </span>
          <span
            className="text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-md"
            style={{
              color: copied ? "#25D366" : "var(--tb-orange)",
              background: copied ? "rgba(37,211,102,0.08)" : "rgba(255,107,53,0.08)",
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </span>
        </button>

        {/* WhatsApp button */}
        <button
          onClick={handleWhatsAppShare}
          className="w-full py-4 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #25D366 0%, #2EE07A 100%)",
            boxShadow: "0 3px 12px rgba(37,211,102,0.25)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Share on WhatsApp
        </button>
      </div>

      {/* Compact stats row */}
      <div
        className="rounded-[18px] overflow-hidden animate-fadeUp"
        style={{
          background: "linear-gradient(145deg, #fff 0%, #FEFCF9 100%)",
          border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          animationDelay: "0.2s",
        }}
      >
        <div className="flex">
          {compactStats.map((item, i) => (
            <div
              key={item.label}
              className="flex-1 flex flex-col items-center gap-1 py-3 px-1.5"
              style={{ borderRight: i < compactStats.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}
            >
              <span className="text-base">{item.icon}</span>
              {item.hasData ? (
                <span className="text-[13px] font-bold text-center leading-tight" style={{ color: "var(--tb-text)" }}>
                  {item.value}
                </span>
              ) : (
                <span
                  className="inline-block w-6 h-2.5 rounded animate-shimmer"
                  style={{ background: "rgba(0,0,0,0.06)" }}
                />
              )}
              <span className="text-[9.5px] font-medium" style={{ color: "var(--tb-light)" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Member avatars */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl animate-fadeIn"
        style={{
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(0,0,0,0.04)",
          animationDelay: "0.25s",
        }}
      >
        <MemberAvatarRow members={displayMembers as Parameters<typeof MemberAvatarRow>[0]["members"]} max={6} size="sm" />
        <span className="text-sm font-semibold" style={{ color: "var(--tb-text)" }}>
          {displayMembers.length} {displayMembers.length === 1 ? "member" : "members"} joined
        </span>
      </div>

      {/* Progress checklist */}
      <div className="flex flex-col gap-1.5 animate-fadeUp" style={{ animationDelay: "0.3s" }}>
        <h2
          className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 pl-1 mb-1"
          style={{ color: "var(--tb-light)" }}
        >
          <span className="text-[13px]">🗺️</span> Your trip journey
        </h2>

        {STEPS.map((step, i) => {
          const stepStatus: StepStatus = getStepStatus(step.path, trip);
          const isCurrent = stepStatus === "current";
          const isLocked = stepStatus === "locked";
          const isDone = stepStatus === "done";
          const isHovered = hoveredStep === i;

          return (
            <Link
              key={step.path}
              href={isLocked ? "#" : `/t/${slug}/${step.path}`}
              onMouseEnter={() => setHoveredStep(i)}
              onMouseLeave={() => setHoveredStep(-1)}
              onClick={(e) => isLocked && e.preventDefault()}
              className="flex items-center gap-3 relative transition-all"
              style={{
                padding: isCurrent ? "14px" : "11px 14px",
                borderRadius: isCurrent ? 18 : 14,
                background: isCurrent
                  ? "linear-gradient(145deg, #fff 0%, #FEFCF9 100%)"
                  : isHovered && !isLocked
                    ? "rgba(255,255,255,0.7)"
                    : "transparent",
                border: isCurrent ? `1.5px solid ${step.color}25` : "1.5px solid transparent",
                boxShadow: isCurrent ? `0 4px 16px ${step.color}08` : "none",
                opacity: isLocked ? 0.4 : 1,
                cursor: isLocked ? "default" : "pointer",
                transform: isHovered && !isLocked ? "translateX(3px)" : "translateX(0)",
                animationDelay: `${0.35 + i * 0.06}s`,
              }}
            >
              {/* Timeline connector */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: 31, top: isCurrent ? 48 : 40,
                    width: 2, height: isCurrent ? 14 : 10,
                    background: isDone ? "rgba(37,211,102,0.3)" : "rgba(0,0,0,0.06)",
                    borderRadius: 2,
                  }}
                />
              )}

              {/* Icon */}
              <div
                className="shrink-0 flex items-center justify-center relative"
                style={{
                  width: isCurrent ? 40 : 34, height: isCurrent ? 40 : 34,
                  borderRadius: isCurrent ? 13 : 10,
                  background: isDone
                    ? "rgba(37,211,102,0.12)"
                    : isCurrent
                      ? `linear-gradient(135deg, ${step.color}15, ${step.color}08)`
                      : "rgba(0,0,0,0.025)",
                  fontSize: isCurrent ? 20 : 17,
                  transform: isHovered && !isLocked ? "scale(1.08)" : "scale(1)",
                  transition: "all 0.2s ease",
                }}
              >
                {step.icon}
                {isDone && (
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: "#25D366", border: "2px solid white" }}
                  >
                    <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p
                    className="text-[13px]"
                    style={{
                      fontWeight: isCurrent ? 700 : 600,
                      color: isLocked ? "var(--tb-light)" : "var(--tb-text)",
                    }}
                  >
                    {step.title}
                  </p>
                  {isCurrent && (
                    <span
                      className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md"
                      style={{ color: step.color, background: `${step.color}10` }}
                    >
                      Next
                    </span>
                  )}
                </div>
                {isCurrent && (
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--tb-muted)" }}>
                    {step.desc}
                  </p>
                )}
              </div>

              {/* Right side */}
              <div className="shrink-0">
                {isLocked ? (
                  <span className="text-sm" style={{ color: "var(--tb-light)" }}>🔒</span>
                ) : isDone ? (
                  <span className="text-[11px] font-semibold" style={{ color: "#25D366" }}>✓ Done</span>
                ) : isCurrent ? (
                  <span
                    className="text-[11px] font-semibold px-2 py-1 rounded-md"
                    style={{ color: step.color, background: `${step.color}08` }}
                  >
                    Go →
                  </span>
                ) : (
                  <span className="text-[11px] font-medium" style={{ color: "var(--tb-light)" }}>›</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
