/**
 * Zero-LLM destination recommendation engine.
 * Scores and ranks destinations from the curated catalog
 * based on seasonality, vibes, budget, and interest tags.
 */

/* ── Types ── */

export interface CatalogEntry {
  id: string;
  name: string;
  state: string;
  pitch: string;
  budget_tier: string;
  cost_min: number;
  cost_max: number;
  season_ratings: number[];   // [Jan..Dec] 1-5
  season_blocked: number[];   // 0-indexed months
  season_notes: Record<string, string>;
  vibes: string[];
  interest_tags: string[];
  pros: string[];
  cons: string[];
  travel_options: TravelOption[];
  photo_url: string | null;
  google_place_id: string | null;
  lat: number | null;
  lng: number | null;
  why_templates: Record<string, string>;
}

export interface TravelOption {
  from: string;
  mode: string;
  duration_hours: number;
  cost_inr: number;
}

export interface OffbeatExperience {
  id: string;
  destination: string;
  name: string;
  description: string;
  category: string;
  price_range: string;
  local_tip: string;
}

export interface RecommendationContext {
  month: number;              // 0-11
  vibes: string[];
  interestTags: string[];
  budgetMin: number;
  budgetMax: number;
  memberCount: number;
  departingCity?: string;
}

export interface ScoredDestination extends CatalogEntry {
  score: number;
  seasonScore: number;
  seasonNote: string | null;
  whyFitsGroup: string;
  travelFromCity: TravelOption | null;
  offbeat: OffbeatExperience[];
}

/* ── Scoring ── */

function rangesOverlap(aMin: number, aMax: number, bMin: number, bMax: number): number {
  const overlapStart = Math.max(aMin, bMin);
  const overlapEnd = Math.min(aMax, bMax);
  if (overlapStart <= overlapEnd) return 1; // direct overlap
  // Check how close the ranges are (within 20% of the budget max)
  const gap = overlapStart - overlapEnd;
  const threshold = aMax * 0.2;
  if (gap <= threshold) return 0.5; // close enough
  return 0;
}

function scoreDestination(
  dest: CatalogEntry,
  ctx: RecommendationContext,
  offbeatCount: number
): number {
  // 1. Season — hard block or 1-5 rating
  if (dest.season_blocked.includes(ctx.month)) return -1;
  const seasonScore = dest.season_ratings[ctx.month] ?? 3;

  // 2. Vibe match (0-1 based on overlap)
  const vibeOverlap = ctx.vibes.filter((v) => dest.vibes.includes(v)).length;
  const vibeScore = ctx.vibes.length > 0
    ? vibeOverlap / ctx.vibes.length
    : 0.5; // no vibes = neutral

  // 3. Interest tag bonus (0.5 per match)
  const tagOverlap = ctx.interestTags.filter((t) => dest.interest_tags.includes(t)).length;
  const tagScore = tagOverlap * 0.5;

  // 4. Budget fit
  const budgetFit = rangesOverlap(ctx.budgetMin, ctx.budgetMax, dest.cost_min, dest.cost_max);

  // 5. Offbeat bonus (small boost for destinations with curated content)
  const offbeatBonus = Math.min(offbeatCount * 0.3, 1.5);

  // Weighted sum
  return (seasonScore * 3) + (vibeScore * 5) + tagScore + (budgetFit * 4) + offbeatBonus;
}

/* ── Why Fits Group ── */

export function buildWhyFitsGroup(dest: CatalogEntry, ctx: RecommendationContext): string {
  // Try exact vibe combo match
  const vibeKey = [...ctx.vibes].sort().join(",");
  if (dest.why_templates[vibeKey]) return dest.why_templates[vibeKey];

  // Try subset matches (2-vibe combos)
  if (ctx.vibes.length > 2) {
    for (let i = 0; i < ctx.vibes.length; i++) {
      for (let j = i + 1; j < ctx.vibes.length; j++) {
        const key = [ctx.vibes[i], ctx.vibes[j]].sort().join(",");
        if (dest.why_templates[key]) return dest.why_templates[key];
      }
    }
  }

  // Try single vibe matches
  for (const v of ctx.vibes) {
    if (dest.why_templates[v]) return dest.why_templates[v];
  }

  // Fallback: generate from matched vibes
  const matchedVibes = ctx.vibes.filter((v) => dest.vibes.includes(v));
  if (matchedVibes.length > 0) {
    return `Great for ${matchedVibes.join(" + ")} lovers. ${dest.pitch}`;
  }

  return dest.pitch;
}

/* ── Season Note ── */

function getSeasonNote(dest: CatalogEntry, month: number): string | null {
  const rating = dest.season_ratings[month] ?? 3;
  const customNote = dest.season_notes[String(month)];

  if (customNote) return customNote;

  if (rating >= 5) return "Peak season — best time to visit";
  if (rating >= 4) return "Great weather — highly recommended";
  if (rating === 3) return "Shoulder season — decent but not ideal";
  if (rating === 2) return "Off-season — limited appeal";
  return "Low season — consider alternatives";
}

/* ── Travel from City ── */

function findTravelFromCity(dest: CatalogEntry, city?: string): TravelOption | null {
  if (!city || !dest.travel_options.length) return null;
  const normalized = city.toLowerCase();
  return dest.travel_options.find(
    (t) => t.from.toLowerCase() === normalized
  ) ?? null;
}

/* ── Main Recommendation Function ── */

export function recommend(
  catalog: CatalogEntry[],
  offbeatByDest: Record<string, OffbeatExperience[]>,
  ctx: RecommendationContext,
  limit = 5
): ScoredDestination[] {
  const scored = catalog
    .map((dest) => {
      const offbeat = offbeatByDest[dest.name] ?? [];
      const score = scoreDestination(dest, ctx, offbeat.length);
      return { dest, score, offbeat };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ dest, score, offbeat }) => {
    // Filter offbeat by matching vibes/tags
    const relevantOffbeat = offbeat
      .filter((o) =>
        ctx.vibes.includes(o.category) ||
        ctx.interestTags.some((t) => o.category.includes(t) || o.description.toLowerCase().includes(t))
      )
      .slice(0, 3);

    // If no vibe-filtered offbeat, just take top 3
    const finalOffbeat = relevantOffbeat.length > 0 ? relevantOffbeat : offbeat.slice(0, 3);

    return {
      ...dest,
      score,
      seasonScore: dest.season_ratings[ctx.month] ?? 3,
      seasonNote: getSeasonNote(dest, ctx.month),
      whyFitsGroup: buildWhyFitsGroup(dest, ctx),
      travelFromCity: findTravelFromCity(dest, ctx.departingCity),
      offbeat: finalOffbeat,
    };
  });
}
