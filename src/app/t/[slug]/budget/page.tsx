"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useTripStore } from "@/store/tripStore";

/* ── constants ── */

const BUDGET_TIERS = [
  {
    id: "budget", emoji: "🏕️", label: "Budget",
    range: "₹5K – ₹15K", min: 5000, max: 15000,
    desc: "Hostels, trains, street food, shared rooms",
    color: "#10B981",
    reaction: "Road trip energy! 🛵",
  },
  {
    id: "midrange", emoji: "🏨", label: "Mid-range",
    range: "₹15K – ₹35K", min: 15000, max: 35000,
    desc: "Hotels, AC bus/train, restaurants, activities",
    color: "#FF6B35",
    reaction: "Sweet spot! This is where the magic happens ✨",
  },
  {
    id: "premium", emoji: "✨", label: "Premium",
    range: "₹35K – ₹60K", min: 35000, max: 60000,
    desc: "4-star stays, flights, curated experiences",
    color: "#8B5CF6",
    reaction: "Fancy! Your friends will love this 💅",
  },
  {
    id: "luxury", emoji: "👑", label: "Luxury",
    range: "₹60K+", min: 60000, max: 200000,
    desc: "5-star resorts, premium everything, no limits",
    color: "#EC4899",
    reaction: "Go big or go home! 👑",
  },
];

const VIBE_GROUPS = [
  {
    label: "Relaxing",
    vibes: [
      { id: "beach", label: "Beach", emoji: "🏖️", color: "#0EA5E9" },
      { id: "chill", label: "Chill", emoji: "😴", color: "#06B6D4" },
      { id: "nature", label: "Nature", emoji: "🌿", color: "#22C55E" },
    ],
  },
  {
    label: "Active",
    vibes: [
      { id: "adventure", label: "Adventure", emoji: "🧗", color: "#EF4444" },
      { id: "nightlife", label: "Nightlife", emoji: "🎉", color: "#8B5CF6" },
      { id: "mountains", label: "Mountains", emoji: "⛰️", color: "#10B981" },
    ],
  },
  {
    label: "Cultural",
    vibes: [
      { id: "culture", label: "Culture", emoji: "🏛️", color: "#F59E0B" },
      { id: "food", label: "Food", emoji: "🍜", color: "#F97316" },
    ],
  },
];

const ALL_VIBES = VIBE_GROUPS.flatMap((g) => g.vibes);

const INTEREST_TAGS_MAP: Record<string, { tags: string[]; emoji: string }> = {
  beach: { emoji: "🏖️", tags: ["water sports", "secluded beaches", "coastal drives", "island hopping", "sunset spots"] },
  mountains: { emoji: "⛰️", tags: ["trekking", "snow", "hill station", "valley views", "camping"] },
  nightlife: { emoji: "🎉", tags: ["clubs", "live music", "rooftop bars", "pub crawl", "brewery tours"] },
  culture: { emoji: "🏛️", tags: ["heritage walks", "religious sites", "local festivals", "crafts", "museums"] },
  adventure: { emoji: "🧗", tags: ["trekking", "paragliding", "rafting", "wildlife safari", "camping", "scuba diving"] },
  chill: { emoji: "😴", tags: ["spa/wellness", "cafe hopping", "sunset spots", "lake views", "yoga retreats"] },
  food: { emoji: "🍜", tags: ["street food", "cooking class", "local cuisine", "food crawl", "fine dining"] },
  nature: { emoji: "🌿", tags: ["wildlife", "waterfalls", "forests", "offbeat villages", "birdwatching"] },
};

interface BudgetData {
  myBudget: { budget_min: number; budget_max: number } | null;
  myVibes: string[];
  myInterestTags: string[];
  overlap: { min: number; max: number } | null;
  vibeCount: Record<string, number>;
  respondedCount: number;
  totalMembers: number;
}

/* ── helpers ── */

function tierFromRange(min: number, max: number): string {
  const tier = BUDGET_TIERS.find((t) => t.min === min && t.max === max);
  return tier ? tier.id : "custom";
}

function getSuggestions(vibes: string[]): string {
  if (vibes.includes("beach") && vibes.includes("nightlife")) return "think Goa, Pondicherry";
  if (vibes.includes("beach") && vibes.includes("chill")) return "think Gokarna, Andaman";
  if (vibes.includes("mountains") && vibes.includes("adventure")) return "think Manali, Leh-Ladakh";
  if (vibes.includes("mountains") && vibes.includes("chill")) return "think Coorg, Munnar";
  if (vibes.includes("culture") && vibes.includes("food")) return "think Jaipur, Lucknow, Varanasi";
  if (vibes.includes("nightlife")) return "think Goa, Mumbai, Bangalore";
  if (vibes.includes("beach")) return "think Goa, Gokarna, Kerala";
  if (vibes.includes("mountains")) return "think Manali, Shimla, Darjeeling";
  if (vibes.includes("nature")) return "think Coorg, Wayanad, Meghalaya";
  if (vibes.includes("food")) return "think Delhi, Lucknow, Kolkata";
  if (vibes.includes("culture")) return "think Rajasthan, Hampi, Mysore";
  if (vibes.includes("adventure")) return "think Rishikesh, Leh, Spiti";
  return "AI will find the perfect match";
}

/* ── loading skeleton ── */

function BudgetLoader() {
  const [s1, setS1] = useState(false);
  const [s2, setS2] = useState(false);
  const [s3, setS3] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setS1(true), 100);
    const t2 = setTimeout(() => setS2(true), 250);
    const t3 = setTimeout(() => setS3(true), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`
        @keyframes bShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .b-skel {
          background: linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 100%);
          background-size: 200% 100%; animation: bShimmer 1.8s ease-in-out infinite;
        }
      `}</style>
      {/* Header */}
      <div style={{
        background: "linear-gradient(145deg, #fff, #FEFCF9)", padding: "20px 20px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
        opacity: s1 ? 1 : 0, transform: s1 ? "translateY(0)" : "translateY(8px)", transition: "all 0.4s ease",
      }}>
        <div className="b-skel" style={{ height: 26, width: "60%", borderRadius: 8, marginBottom: 10 }} />
        <div className="b-skel" style={{ height: 18, width: "80%", borderRadius: 100 }} />
      </div>
      {/* Tier grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 20px",
        opacity: s2 ? 1 : 0, transform: s2 ? "translateY(0)" : "translateY(8px)", transition: "all 0.4s ease",
      }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="b-skel" style={{ height: 130, borderRadius: 18 }} />
        ))}
      </div>
      {/* Vibes */}
      <div style={{
        padding: "0 20px", display: "flex", flexDirection: "column", gap: 12,
        opacity: s3 ? 1 : 0, transform: s3 ? "translateY(0)" : "translateY(8px)", transition: "all 0.4s ease",
      }}>
        <div className="b-skel" style={{ height: 20, width: "40%", borderRadius: 8 }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="b-skel" style={{ height: 40, width: 90, borderRadius: 100 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── page ── */

export default function BudgetPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [data, setData] = useState<BudgetData | null>(null);

  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [customMin, setCustomMin] = useState(15000);
  const [customMax, setCustomMax] = useState(35000);
  const [vibes, setVibes] = useState<string[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [tappedTier, setTappedTier] = useState<string | null>(null);
  const [tappedVibe, setTappedVibe] = useState<string | null>(null);
  const [interestTags, setInterestTags] = useState<string[]>([]);

  /* fetch */
  useEffect(() => {
    const minDelay = new Promise((r) => setTimeout(r, 2000));
    Promise.all([
      fetch(`/api/trips/${slug}/budget`).then((r) => r.json()),
      minDelay,
    ]).then(([d]: [BudgetData, unknown]) => {
      setData(d);
      if (d.myBudget) {
        setCustomMin(d.myBudget.budget_min);
        setCustomMax(d.myBudget.budget_max);
        const tid = tierFromRange(d.myBudget.budget_min, d.myBudget.budget_max);
        setSelectedTier(tid);
        if (tid === "custom") setShowCustom(true);
      }
      if (d.myVibes?.length > 0) setVibes(d.myVibes);
      if (d.myInterestTags?.length > 0) setInterestTags(d.myInterestTags);
      setLoading(false);
    }).catch(() => {
      toast.error("Could not load budget data");
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /* save */
  async function handleSave() {
    if (vibes.length === 0) return;
    setSaving(true);
    const budget_min = customMin;
    const budget_max = customMax;
    const res = await fetch(`/api/trips/${slug}/budget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budget_min, budget_max, vibes, interest_tags: interestTags }),
    });
    const body = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(body.error ?? "Could not save. Try again.");
      return;
    }
    setSaved(true);
    setIsDirty(false);
    toast.success("Vibe locked in!");
    const fresh = await fetch(`/api/trips/${slug}/budget`).then((r) => r.json());
    setData(fresh);
  }

  /* tier tap */
  function handleTierTap(tier: typeof BUDGET_TIERS[0]) {
    setTappedTier(tier.id);
    setSelectedTier(tier.id);
    setShowCustom(false);
    setCustomMin(tier.min);
    setCustomMax(tier.max);
    setIsDirty(true);
    setSaved(false);
    setTimeout(() => setTappedTier(null), 350);
  }

  /* vibe toggle */
  function toggleVibe(id: string) {
    setTappedVibe(id);
    setVibes((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
    setIsDirty(true);
    setSaved(false);
    setTimeout(() => setTappedVibe(null), 350);
  }

  if (loading) return <BudgetLoader />;

  const canSave = isDirty && vibes.length > 0;
  const activeTier = BUDGET_TIERS.find((t) => t.id === selectedTier);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingBottom: 160, background: "#F5F1EB", minHeight: "calc(100vh - 52px)" }}>
      <style>{`
        body { background: #F5F1EB !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInCard { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes vibeBounce { 0% { transform: scale(1); } 30% { transform: scale(0.9); } 60% { transform: scale(1.08); } 100% { transform: scale(1); } }
        @keyframes emojiWiggle { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-8deg); } 75% { transform: rotate(8deg); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: var(--tb-orange); border: 3px solid white; box-shadow: 0 2px 6px rgba(255,107,53,0.3); cursor: pointer; }
        input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
      `}</style>

      {/* ── Page header ── */}
      <div style={{
        background: "linear-gradient(145deg, #fff 0%, #FEFCF9 100%)",
        padding: "20px 20px 16px", borderBottom: "1px solid rgba(0,0,0,0.04)",
        animation: "fadeUp 0.4s ease-out both",
      }}>
        <h1
          className="font-playfair"
          style={{ fontSize: 22, fontWeight: 800, color: "var(--tb-text)", display: "flex", alignItems: "center", gap: 8 }}
        >
          <span>💰</span> Budget + Vibe
        </h1>
        <p style={{ fontSize: 13, color: "var(--tb-muted)", marginTop: 4 }}>
          Your budget stays private — only the overlap is shown
        </p>
        <div style={{
          marginTop: 10, display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: 12, background: "rgba(0,0,0,0.015)",
        }}>
          <span style={{ fontSize: 14 }}>🔒</span>
          <span style={{ fontSize: 11.5, color: "var(--tb-muted)", lineHeight: 1.4 }}>
            Individual budgets are never shared. We only show where everyone overlaps.
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 20 }}>

        {/* ── Budget tiers ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.4s ease-out 0.15s both" }}>
          <div style={{ padding: "0 20px" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--tb-text)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>💰</span>
              Your comfort budget
              <span style={{ fontSize: 12, fontWeight: 400, color: "var(--tb-light)" }}>(per person)</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 20px" }}>
            {BUDGET_TIERS.map((tier, i) => {
              const isActive = selectedTier === tier.id;
              const isTapped = tappedTier === tier.id;
              return (
                <button
                  key={tier.id}
                  onClick={() => handleTierTap(tier)}
                  style={{
                    padding: "16px 14px", borderRadius: 18,
                    border: `2px solid ${isActive ? tier.color : "rgba(0,0,0,0.04)"}`,
                    background: isActive
                      ? `linear-gradient(145deg, ${tier.color}08, ${tier.color}04)`
                      : "linear-gradient(145deg, #fff, #FEFCF9)",
                    cursor: "pointer", textAlign: "left" as const,
                    transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                    transform: isTapped ? "scale(0.94)" : isActive ? "scale(1.01)" : "scale(1)",
                    boxShadow: isActive ? `0 4px 16px ${tier.color}15` : "0 1px 4px rgba(0,0,0,0.03)",
                    animation: `slideInCard 0.35s ease-out ${0.05 * i}s both`,
                    fontFamily: "inherit",
                    display: "flex", flexDirection: "column" as const, gap: 6,
                    position: "relative" as const, overflow: "hidden" as const,
                  }}
                >
                  {isActive && (
                    <div style={{
                      position: "absolute", top: 8, right: 8,
                      width: 20, height: 20, borderRadius: "50%", background: tier.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l4 4 6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <span style={{ fontSize: 28 }}>{tier.emoji}</span>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? tier.color : "var(--tb-text)" }}>{tier.label}</span>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? tier.color : "var(--tb-muted)", marginTop: 1 }}>{tier.range}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--tb-light)", lineHeight: 1.35 }}>{tier.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Tier reaction */}
          {activeTier && selectedTier !== "custom" && (
            <div style={{ padding: "0 20px", animation: "fadeIn 0.4s ease-out both" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 12,
                background: `${activeTier.color}06`, border: `1px solid ${activeTier.color}10`,
              }}>
                <span style={{ fontSize: 14 }}>{activeTier.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: activeTier.color }}>{activeTier.reaction}</span>
              </div>
            </div>
          )}

          {/* Custom range toggle */}
          <div style={{ padding: "0 20px" }}>
            <button
              onClick={() => {
                const willOpen = !showCustom;
                setShowCustom(willOpen);
                if (willOpen) {
                  setSelectedTier("custom");
                  setIsDirty(true);
                  setSaved(false);
                } else if (selectedTier === "custom") {
                  setSelectedTier(null);
                }
              }}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 14,
                border: `1.5px solid ${selectedTier === "custom" ? "var(--tb-teal, #00A8A8)" : "rgba(0,0,0,0.05)"}`,
                background: selectedTier === "custom" ? "rgba(0,168,168,0.04)" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.25s ease",
              }}
            >
              <span style={{ fontSize: 13 }}>⚙️</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: selectedTier === "custom" ? "#008B8B" : "var(--tb-muted)" }}>
                Custom range
              </span>
              <span style={{ fontSize: 12, color: "var(--tb-light)", transform: showCustom ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", display: "inline-block" }}>▾</span>
            </button>

            {showCustom && (
              <div style={{
                marginTop: 10, padding: 16, borderRadius: 16, background: "#fff",
                border: "1px solid rgba(0,0,0,0.04)", animation: "fadeUp 0.3s ease-out both",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ padding: "4px 12px", borderRadius: 10, background: "var(--tb-orange-bg, #FFF0E8)" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--tb-orange)" }}>₹{Math.round(customMin / 1000)}K</span>
                  </div>
                  <span style={{ color: "var(--tb-light)", fontSize: 13, alignSelf: "center" }}>to</span>
                  <div style={{ padding: "4px 12px", borderRadius: 10, background: "var(--tb-orange-bg, #FFF0E8)" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--tb-orange)" }}>
                      ₹{customMax >= 100000 ? `${(customMax / 100000).toFixed(1)}L` : `${Math.round(customMax / 1000)}K`}
                    </span>
                  </div>
                </div>
                <div style={{ position: "relative", height: 32, marginBottom: 8 }}>
                  <div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 6, borderRadius: 100, background: "#EDE8E0" }}>
                    <div style={{
                      position: "absolute", height: "100%", borderRadius: 100,
                      background: "linear-gradient(90deg, var(--tb-orange), var(--tb-orange-light))",
                      left: `${(customMin / 200000) * 100}%`,
                      width: `${((customMax - customMin) / 200000) * 100}%`,
                    }} />
                  </div>
                  <input type="range" min="5000" max="200000" step="5000" value={customMin}
                    onChange={(e) => { setCustomMin(Math.min(+e.target.value, customMax - 5000)); setIsDirty(true); setSaved(false); }}
                    style={{ position: "absolute", top: 6, left: 0, width: "100%", height: 20, cursor: "pointer", zIndex: 2 }}
                  />
                  <input type="range" min="5000" max="200000" step="5000" value={customMax}
                    onChange={(e) => { setCustomMax(Math.max(+e.target.value, customMin + 5000)); setIsDirty(true); setSaved(false); }}
                    style={{ position: "absolute", top: 6, left: 0, width: "100%", height: 20, cursor: "pointer", zIndex: 3 }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--tb-light)" }}>
                  <span>₹5K</span><span>₹2L</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Vibe selector ── */}
        <div style={{ padding: "0 20px", animation: "fadeUp 0.4s ease-out 0.25s both" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--tb-text)", display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>✨</span>
            What kind of trip?
          </h2>

          {/* Info card */}
          <div style={{
            padding: "10px 14px", borderRadius: 12, marginBottom: 14,
            background: "rgba(255,107,53,0.03)", border: "1px solid rgba(255,107,53,0.06)",
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <span style={{ fontSize: 15, marginTop: 1 }}>🎯</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--tb-text)", marginBottom: 2 }}>
                This helps AI pick your perfect destination
              </p>
              <p style={{ fontSize: 12, color: "var(--tb-muted)", lineHeight: 1.4 }}>
                Select the vibes that match your mood — the more you pick, the better the suggestions
              </p>
            </div>
          </div>

          {/* Grouped vibes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {VIBE_GROUPS.map((group) => (
              <div key={group.label}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--tb-light)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>
                  {group.label}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                  {group.vibes.map((vibe, i) => {
                    const isSelected = vibes.includes(vibe.id);
                    const isTapped = tappedVibe === vibe.id;
                    return (
                      <button
                        key={vibe.id}
                        onClick={() => toggleVibe(vibe.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 7,
                          padding: "10px 16px", borderRadius: 100,
                          border: `1.5px solid ${isSelected ? vibe.color : "rgba(0,0,0,0.06)"}`,
                          background: isSelected ? `${vibe.color}10` : "#fff",
                          cursor: "pointer",
                          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                          transform: isTapped ? "scale(0.9)" : isSelected ? "scale(1.02)" : "scale(1)",
                          animation: isTapped ? "vibeBounce 0.35s ease-out" : `slideInCard 0.3s ease-out ${0.03 * i}s both`,
                          boxShadow: isSelected ? `0 2px 10px ${vibe.color}15` : "0 1px 3px rgba(0,0,0,0.03)",
                          fontFamily: "inherit",
                        }}
                      >
                        <span style={{
                          fontSize: 18, display: "inline-block",
                          animation: isSelected ? "emojiWiggle 0.5s ease-out" : "none",
                        }}>{vibe.emoji}</span>
                        <span style={{
                          fontSize: 13, fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? vibe.color : "var(--tb-muted)",
                        }}>{vibe.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {vibes.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, animation: "fadeIn 0.3s ease both" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--tb-orange)" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tb-orange)" }}>
                {vibes.length} {vibes.length === 1 ? "vibe" : "vibes"} selected
              </span>
            </div>
          )}

          {/* ── Interest tags (contextual sub-tags) ── */}
          {vibes.length > 0 && (() => {
            const availableTags = vibes.flatMap((v) => {
              const group = INTEREST_TAGS_MAP[v];
              return group ? group.tags.map((t) => ({ tag: t, vibe: v, emoji: group.emoji })) : [];
            });
            // Deduplicate tags
            const seen = new Set<string>();
            const uniqueTags = availableTags.filter((t) => {
              if (seen.has(t.tag)) return false;
              seen.add(t.tag);
              return true;
            });
            if (uniqueTags.length === 0) return null;
            return (
              <div style={{ marginTop: 16, animation: "fadeUp 0.4s ease-out both" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 14 }}>🎯</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tb-text)" }}>Refine your vibe</span>
                  <span style={{ fontSize: 11, color: "var(--tb-light)", fontWeight: 400 }}>(optional)</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {uniqueTags.map(({ tag }) => {
                    const isSelected = interestTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          setInterestTags((prev) =>
                            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                          );
                          setIsDirty(true);
                          setSaved(false);
                        }}
                        style={{
                          padding: "7px 14px", borderRadius: 100,
                          border: `1.5px solid ${isSelected ? "var(--tb-teal, #00A8A8)" : "rgba(0,0,0,0.06)"}`,
                          background: isSelected ? "rgba(0,168,168,0.08)" : "#fff",
                          color: isSelected ? "#008B8B" : "var(--tb-muted)",
                          fontSize: 12, fontWeight: isSelected ? 600 : 500,
                          cursor: "pointer", fontFamily: "inherit",
                          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                          transform: isSelected ? "scale(1.02)" : "scale(1)",
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {interestTags.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4, animation: "fadeIn 0.3s ease both" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00A8A8" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#00A8A8" }}>
                      {interestTags.length} tag{interestTags.length !== 1 ? "s" : ""} selected — helps find hidden gems
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Trip personality card ── */}
        {selectedTier && vibes.length > 0 && (() => {
          const tier = activeTier || { label: "Custom", color: "#00A8A8" };
          const vibeLabels = vibes.map((v) => ALL_VIBES.find((vb) => vb.id === v)).filter(Boolean) as typeof ALL_VIBES;
          const vibeNames = vibeLabels.map((v) => v.label.toLowerCase()).join(" + ");
          const vibeEmojis = vibeLabels.map((v) => v.emoji).join("");
          return (
            <div style={{
              margin: "0 20px", padding: 16, borderRadius: 18,
              background: `linear-gradient(145deg, ${tier.color}06, ${tier.color}03)`,
              border: `1.5px solid ${tier.color}15`,
              animation: "fadeUp 0.4s ease-out both",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 15 }}>🌟</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tb-text)" }}>Your trip personality</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--tb-text)", lineHeight: 1.5 }}>
                You&apos;re looking for a <strong style={{ color: tier.color }}>{tier.label.toLowerCase()}</strong> {vibeNames} trip {vibeEmojis}
              </p>
              <p style={{ fontSize: 12, color: "var(--tb-muted)", marginTop: 4 }}>
                {getSuggestions(vibes)} 💡
              </p>
            </div>
          );
        })()}

        {/* ── Group pulse ── */}
        {data && (() => {
          const rc = data.respondedCount;
          const tm = data.totalMembers;
          const msg = rc === 0
            ? { emoji: "📩", text: "No one has set their budget yet", color: "#FF6B35" }
            : rc === 1 && tm > 1
            ? { emoji: "🎉", text: "You're the first one! Waiting for others...", color: "#FF6B35" }
            : rc === tm
            ? { emoji: "🚀", text: "Everyone's in! Budget overlap is ready", color: "#25D366" }
            : { emoji: "⏳", text: `${rc}/${tm} have set their budget`, color: "#00A8A8" };

          return (
            <div style={{
              margin: "0 20px", padding: "14px 16px", borderRadius: 16,
              background: "linear-gradient(145deg, #fff, #FEFCF9)",
              border: "1px solid rgba(0,0,0,0.04)",
              animation: "fadeUp 0.4s ease-out 0.3s both",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tb-text)" }}>Group pulse</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: msg.color, padding: "3px 10px", borderRadius: 8, background: `${msg.color}08` }}>
                  {rc}/{tm}
                </span>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: 10,
                background: `${msg.color}06`, border: `1px solid ${msg.color}10`,
              }}>
                <span style={{ fontSize: 15 }}>{msg.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: msg.color }}>{msg.text}</span>
              </div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 100, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
                <div style={{
                  width: `${tm > 0 ? (rc / tm) * 100 : 0}%`,
                  height: "100%", borderRadius: 100,
                  background: `linear-gradient(90deg, ${msg.color}, ${msg.color}80)`,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Sticky save ── */}
      <div style={{
        position: "fixed", bottom: 72, zIndex: 35,
        width: "100%", maxWidth: 480,
        left: "50%", transform: "translateX(-50%)",
        padding: "12px 20px 0",
        background: "linear-gradient(transparent, rgba(245,241,235,0.98) 40%)",
        pointerEvents: "none" as const,
      }}>
        <button
          onClick={handleSave}
          disabled={saving || !canSave}
          style={{
            width: "100%", padding: "16px 24px", borderRadius: 18, border: "none",
            background: saved
              ? "linear-gradient(135deg, #00A8A8, #00C4C4)"
              : !canSave ? "rgba(0,0,0,0.06)"
              : "linear-gradient(135deg, #25D366, #2EE07A)",
            color: saved ? "#fff" : !canSave ? "var(--tb-light)" : "#fff",
            fontSize: 16, fontWeight: 700, fontFamily: "inherit",
            cursor: saving || !canSave ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            boxShadow: canSave && !saved ? "0 3px 12px rgba(37,211,102,0.2)" : "none",
            transition: "all 0.35s ease",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            pointerEvents: "auto" as const,
          }}
        >
          {saving ? (
            <>
              <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              Saving...
            </>
          ) : saved ? (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.41 5.29a.75.75 0 00-1.06-1.06L7 7.59 5.65 6.24a.75.75 0 10-1.06 1.06l1.88 1.88a.75.75 0 001.06 0l3.88-3.89z"/>
              </svg>
              Vibe locked in!
            </>
          ) : !canSave && vibes.length === 0 ? (
            "Select a vibe to continue"
          ) : !isDirty ? (
            <>✅ Preferences locked in</>
          ) : (
            <>Lock in my vibe →</>
          )}
        </button>
      </div>
    </div>
  );
}
