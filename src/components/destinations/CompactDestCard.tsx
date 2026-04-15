"use client";

import { useState } from "react";

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
  season_score?: number | null;
  seasonality_note?: string | null;
  offbeat_experiences?: OffbeatExperience[];
}

/* ── Theme palette ── */

const THEMES = [
  { gradient: "linear-gradient(135deg, #0EA5E9, #06B6D4)", accent: "#0EA5E9", emoji: "\uD83C\uDFD6\uFE0F" },
  { gradient: "linear-gradient(135deg, #10B981, #059669)", accent: "#10B981", emoji: "\u26F0\uFE0F" },
  { gradient: "linear-gradient(135deg, #F59E0B, #D97706)", accent: "#F59E0B", emoji: "\uD83C\uDFDE\uFE0F" },
  { gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)", accent: "#8B5CF6", emoji: "\uD83C\uDFDB\uFE0F" },
  { gradient: "linear-gradient(135deg, #F43F5E, #E11D48)", accent: "#F43F5E", emoji: "\uD83C\uDF3F" },
  { gradient: "linear-gradient(135deg, #14B8A6, #0D9488)", accent: "#14B8A6", emoji: "\u2615" },
];

export function getDestTheme(index: number) {
  return THEMES[index % THEMES.length];
}

/* ── Helpers ── */

function formatINR(val: number): string {
  if (val >= 100000) return `\u20B9${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `\u20B9${(val / 1000).toFixed(0)}K`;
  return `\u20B9${val}`;
}

const MODE_ICONS: Record<string, string> = {
  flight: "\u2708\uFE0F",
  train: "\uD83D\uDE82",
  bus: "\uD83D\uDE8C",
  drive: "\uD83D\uDE97",
};

/* ── Component ── */

interface Props {
  destination: Destination;
  themeGradient: string;
  themeAccent: string;
  themeEmoji: string;
  isVoted?: boolean;
  onToggleVote?: () => void;
  voteCount?: number;
  revealDelay?: number;
  saving?: boolean;
}

export function CompactDestCard({
  destination: dest,
  themeGradient,
  themeAccent,
  themeEmoji,
  isVoted,
  onToggleVote,
  voteCount,
  revealDelay = 0,
  saving,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const hasCost = dest.estimated_cost_min && dest.estimated_cost_max;
  const costStr = hasCost
    ? `${formatINR(dest.estimated_cost_min!)}–${formatINR(dest.estimated_cost_max!)}`
    : null;

  return (
    <div style={{
      borderRadius: 18, overflow: "hidden",
      background: "linear-gradient(145deg, #fff, #FEFCF9)",
      border: isVoted ? `2px solid ${themeAccent}40` : "1px solid rgba(0,0,0,0.04)",
      boxShadow: isVoted ? `0 4px 16px ${themeAccent}15` : "0 2px 10px rgba(0,0,0,0.035)",
      animation: `cardReveal 0.5s ease-out ${revealDelay}s both`,
      transition: "border 0.25s ease, box-shadow 0.25s ease",
    }}>
      {/* Gradient header strip */}
      <div style={{
        padding: "14px 16px",
        background: themeGradient,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 22 }}>{themeEmoji}</span>
          <div style={{ minWidth: 0 }}>
            <h3 className="font-playfair" style={{
              fontSize: 16, fontWeight: 800, color: "#fff",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{dest.name}</h3>
            {costStr && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                {costStr}/person
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {/* Season badge */}
          {dest.season_score != null && (
            <span style={{
              fontSize: 10, fontWeight: 600, color: "#fff",
              padding: "3px 8px", borderRadius: 100,
              background: dest.season_score >= 4 ? "rgba(34,197,94,0.6)"
                : dest.season_score === 3 ? "rgba(245,158,11,0.6)"
                : "rgba(239,68,68,0.6)",
              whiteSpace: "nowrap",
            }}>
              {dest.season_score >= 4 ? "\uD83D\uDFE2" : dest.season_score === 3 ? "\uD83D\uDFE1" : "\uD83D\uDD34"}{" "}
              {dest.season_score >= 5 ? "Peak" : dest.season_score >= 4 ? "Great" : dest.season_score === 3 ? "Shoulder" : "Off"}
            </span>
          )}

          {/* Vote button */}
          {onToggleVote && (
            <button onClick={(e) => { e.stopPropagation(); if (!saving) onToggleVote(); }} style={{
              width: 34, height: 34, borderRadius: 10, border: "none",
              background: isVoted ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.15)",
              cursor: saving ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
              transform: isVoted ? "scale(1.05)" : "scale(1)",
            }}>
              {saving && isVoted ? (
                <span style={{
                  display: "inline-block", width: 16, height: 16,
                  border: "2px solid rgba(239,68,68,0.25)", borderTopColor: "#EF4444",
                  borderRadius: "50%", animation: "spin 0.7s linear infinite",
                }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isVoted ? "#EF4444" : "none"} stroke={isVoted ? "#EF4444" : "rgba(255,255,255,0.8)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              )}
            </button>
          )}

          {/* Expand toggle */}
          <button onClick={() => setExpanded(!expanded)} style={{
            background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer",
            width: 30, height: 30, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease",
          }}>
            <span style={{
              fontSize: 12, color: "#fff",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease", display: "inline-block",
            }}>{"\u25BE"}</span>
          </button>
        </div>
      </div>

      {/* Vote count */}
      {voteCount != null && voteCount > 0 && (
        <div style={{ padding: "8px 16px 0", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12 }}>{"\u2764\uFE0F"}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: themeAccent }}>
            {voteCount} {voteCount === 1 ? "vote" : "votes"}
          </span>
        </div>
      )}

      {/* Expandable content */}
      {expanded && (
        <div style={{ padding: "10px 16px 14px", display: "flex", flexDirection: "column", gap: 8, animation: "fadeIn 0.25s ease both" }}>
          <p style={{ fontSize: 13, color: "#6B6560", lineHeight: 1.5, fontStyle: "italic" }}>{dest.pitch}</p>

          {/* Pros & Cons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {dest.pros.map((p) => (
              <span key={p} style={{ fontSize: 10.5, padding: "3px 9px", borderRadius: 100, background: "#10B98110", color: "#059669", fontWeight: 500 }}>
                {"\u2713"} {p}
              </span>
            ))}
            {dest.cons.map((c) => (
              <span key={c} style={{ fontSize: 10.5, padding: "3px 9px", borderRadius: 100, background: "#F59E0B10", color: "#D97706", fontWeight: 500 }}>
                {"\u26A0"} {c}
              </span>
            ))}
          </div>

          {/* Seasonality note */}
          {dest.seasonality_note && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6B6560", padding: "6px 10px", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.1)" }}>
              <span>{"\uD83D\uDCC5"}</span>
              <span>{dest.seasonality_note}</span>
            </div>
          )}

          {/* Offbeat hidden gems */}
          {dest.offbeat_experiences && dest.offbeat_experiences.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11 }}>{"\uD83D\uDC8E"}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#2D2A26" }}>Hidden gems</span>
              </div>
              {dest.offbeat_experiences.map((exp) => (
                <div key={exp.name} style={{
                  padding: "6px 10px", borderRadius: 10,
                  background: "rgba(0,168,168,0.04)", border: "1px solid rgba(0,168,168,0.08)",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#006666" }}>{exp.name}</div>
                  <div style={{ fontSize: 10.5, color: "#6B6560", marginTop: 2 }}>{exp.description}</div>
                  {exp.local_tip && (
                    <div style={{ fontSize: 10, color: "#9A9490", marginTop: 2, fontStyle: "italic" }}>
                      {"\uD83E\uDD2B"} {exp.local_tip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Travel options */}
          {dest.travel_options && dest.travel_options.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {dest.travel_options.slice(0, 3).map((t, i) => (
                <span key={`${t.mode}-${i}`} style={{
                  fontSize: 10.5, padding: "3px 9px", borderRadius: 100,
                  background: "#FDF6EC", border: "1px solid #F0E6D3", color: "#6B6560",
                  display: "inline-flex", alignItems: "center", gap: 3,
                }}>
                  {MODE_ICONS[t.mode] ?? "\uD83D\uDE80"} {t.mode} {t.duration_hours}h
                  {t.cost_inr ? ` ${formatINR(t.cost_inr)}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collapsed spacing */}
      {!expanded && voteCount == null && <div style={{ height: 6 }} />}
      {!expanded && voteCount != null && voteCount === 0 && <div style={{ height: 6 }} />}
    </div>
  );
}
