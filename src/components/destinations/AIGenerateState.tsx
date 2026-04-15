"use client";

const C = {
  orange: "#FF6B35", orangeLight: "#FF8F5E",
  teal: "#00A8A8",
  white: "#FFFFFF",
  text: "#2D2A26", textMuted: "#6B6560", textLight: "#9A9490",
};

function formatINR(val: number): string {
  if (val >= 100000) return `\u20B9${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `\u20B9${(val / 1000).toFixed(0)}K`;
  return `\u20B9${val}`;
}

interface Props {
  onGenerate: () => void;
  generating: boolean;
  isOrganizer: boolean;
  budgetMin: number | null;
  budgetMax: number | null;
  vibes: string[];
  dateStart: string | null;
  dateEnd: string | null;
}

export function AIGenerateState({
  onGenerate,
  generating,
  isOrganizer,
  budgetMin,
  budgetMax,
  vibes,
  dateStart,
  dateEnd,
}: Props) {
  const budgetLabel = budgetMin && budgetMax
    ? `${formatINR(budgetMin)}–${formatINR(budgetMax)}`
    : null;

  const dateLabel = dateStart && dateEnd
    ? `${new Date(dateStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(dateEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
    : null;

  const VIBE_EMOJI: Record<string, string> = {
    beach: "\uD83C\uDFD6\uFE0F", nightlife: "\uD83C\uDF89", food: "\uD83C\uDF5C",
    chill: "\uD83D\uDE34", adventure: "\uD83E\uDDD7", mountains: "\u26F0\uFE0F",
    culture: "\uD83C\uDFDB\uFE0F", nature: "\uD83C\uDF3F",
  };

  const pills: { icon: string; label: string }[] = [];
  if (budgetLabel) pills.push({ icon: "\uD83D\uDCB0", label: budgetLabel });
  if (dateLabel) pills.push({ icon: "\uD83D\uDCC5", label: dateLabel });
  for (const v of vibes.slice(0, 3)) {
    pills.push({ icon: VIBE_EMOJI[v] ?? "\u2728", label: v.charAt(0).toUpperCase() + v.slice(1) });
  }

  return (
    <div style={{ padding: "0 16px", animation: "fadeUp 0.4s ease-out 0.15s both" }}>
      <style>{`
        @keyframes orbitDot { 0% { transform: rotate(0deg) translateX(22px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(22px) rotate(-360deg); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(255,107,53,0.3); } 50% { box-shadow: 0 0 0 10px rgba(255,107,53,0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{
        padding: "28px 22px", borderRadius: 22, textAlign: "center",
        background: `linear-gradient(145deg, ${C.white}, #FEFCF9)`,
        border: "1px solid rgba(0,0,0,0.04)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      }}>
        {/* AI icon with orbiting dots */}
        <div style={{ position: "relative", width: 64, height: 64 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: `linear-gradient(135deg, ${C.orange}15, ${C.teal}10)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
          }}>
            {generating ? "\uD83E\uDDE0" : "\u2728"}
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              position: "absolute", top: "50%", left: "50%",
              width: 6, height: 6, borderRadius: "50%",
              background: [C.orange, C.teal, "#8B5CF6"][i],
              animation: `orbitDot ${2 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.4}s`,
              opacity: generating ? 1 : 0.3,
            }} />
          ))}
        </div>

        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6 }}>
            {generating ? "AI is finding your perfect spots..." : "Where should you go?"}
          </h3>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
            {generating
              ? "Crunching your budget, dates, and vibes to find the best match"
              : pills.length > 0
                ? "Based on your group\u2019s preferences. Let\u2019s see what fits!"
                : "AI will suggest destinations based on your group\u2019s budget, dates, and vibes"}
          </p>
        </div>

        {/* Context pills */}
        {!generating && pills.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {pills.map((p) => (
              <span key={p.label} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "5px 10px", borderRadius: 100,
                background: `${C.orange}06`, border: `1px solid ${C.orange}08`,
                fontSize: 11, color: C.orange, fontWeight: 600,
              }}>
                <span style={{ fontSize: 12 }}>{p.icon}</span>{p.label}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        {isOrganizer ? (
          <button onClick={onGenerate} disabled={generating} style={{
            width: "100%", padding: "16px 24px", borderRadius: 16, border: "none",
            background: generating ? `${C.orange}90` : `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
            color: C.white, fontSize: 16, fontWeight: 700, fontFamily: "inherit",
            cursor: generating ? "wait" : "pointer",
            boxShadow: `0 4px 16px ${C.orange}20`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            animation: generating ? "none" : "pulseGlow 2.5s ease-in-out infinite 2s",
          }}>
            {generating ? (
              <>
                <span style={{
                  display: "inline-block", width: 16, height: 16,
                  border: "2px solid rgba(255,255,255,0.3)", borderTopColor: C.white,
                  borderRadius: "50%", animation: "spin 0.7s linear infinite",
                }} />
                Analysing preferences...
              </>
            ) : (
              <>{"\u2728"} Suggest Destinations (AI)</>
            )}
          </button>
        ) : (
          <p style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>
            Waiting for the organizer to generate suggestions
          </p>
        )}
      </div>
    </div>
  );
}
