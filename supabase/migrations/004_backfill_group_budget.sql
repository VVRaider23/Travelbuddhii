-- ─── Migration 004: Backfill the group budget ────────────────────────────────
--
-- The budget route only wrote trips.budget_min / budget_max when at least two
-- people had voted AND their ranges intersected. Every trip that fell outside
-- that, which on 2026-08-24 was 18 of the 19 trips with any budget vote at all,
-- kept a null budget. The itinerary prompt then substituted a hardcoded
-- Rs 40,000 that nobody in the group had agreed to.
--
-- The rule now is the one in src/lib/groupBudget.ts and it always produces an
-- answer: the ceiling is the lowest budget_max anyone submitted, and the floor
-- is the highest budget_min, clamped to the ceiling so a set of ranges that
-- miss each other cannot invert.
--
-- This brings existing trips in line with that. New writes go through the route.

UPDATE trips t
SET budget_min = agg.group_floor,
    budget_max = agg.group_ceiling
FROM (
  SELECT trip_id,
         MIN(budget_max)                             AS group_ceiling,
         LEAST(MAX(budget_min), MIN(budget_max))     AS group_floor
  FROM budget_votes
  GROUP BY trip_id
) agg
WHERE t.id = agg.trip_id
  AND (t.budget_min IS DISTINCT FROM agg.group_floor
    OR t.budget_max IS DISTINCT FROM agg.group_ceiling);
