import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const BudgetSchema = z.object({
  budget_min: z.number().int().min(1000).max(1000000),
  budget_max: z.number().int().min(1000).max(1000000),
  vibes: z.array(z.string()).min(1).max(8),
  interest_tags: z.array(z.string()).max(20).optional(),
});

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

// GET — fetch all budget votes + vibe votes
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: trip } = await admin.from("trips").select("id").eq("slug", slug).single();
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: budgetVotes }, { data: vibeVotes }, { data: members }] = await Promise.all([
    admin.from("budget_votes").select("user_id, budget_min, budget_max").eq("trip_id", trip.id),
    admin.from("vibe_votes").select("user_id, vibes, interest_tags").eq("trip_id", trip.id),
    admin.from("trip_members").select("user_id").eq("trip_id", trip.id),
  ]);

  // Compute overlap range (intersection of all submitted ranges)
  const votes = budgetVotes ?? [];
  let overlapMin = 0;
  let overlapMax = Infinity;
  for (const v of votes) {
    overlapMin = Math.max(overlapMin, v.budget_min);
    overlapMax = Math.min(overlapMax, v.budget_max);
  }

  const overlap = votes.length >= 2 && overlapMin <= overlapMax
    ? { min: overlapMin, max: overlapMax }
    : null;

  // Tally vibes
  const vibeCount: Record<string, number> = {};
  for (const v of vibeVotes ?? []) {
    for (const vibe of v.vibes) {
      vibeCount[vibe] = (vibeCount[vibe] ?? 0) + 1;
    }
  }

  // My vote
  const myBudget = votes.find((v: { user_id: string }) => v.user_id === user.id) ?? null;
  const myVibeVote = (vibeVotes ?? []).find((v: { user_id: string }) => v.user_id === user.id);
  const myVibes = myVibeVote?.vibes ?? [];
  const myInterestTags = myVibeVote?.interest_tags ?? [];

  return NextResponse.json({
    myBudget,
    myVibes,
    myInterestTags,
    overlap,
    vibeCount,
    respondedCount: votes.length,
    totalMembers: (members ?? []).length,
  });
}

// POST — upsert budget + vibe vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = BudgetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (parsed.data.budget_min > parsed.data.budget_max) {
    return NextResponse.json({ error: "Min must be ≤ max" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: trip } = await admin.from("trips").select("id").eq("slug", slug).single();
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify membership
  const { data: membership } = await admin
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", trip.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Upsert budget vote
  const { data: existing } = await admin
    .from("budget_votes")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await admin
      .from("budget_votes")
      .update({ budget_min: parsed.data.budget_min, budget_max: parsed.data.budget_max })
      .eq("id", existing.id);
  } else {
    await admin.from("budget_votes").insert({
      trip_id: trip.id,
      user_id: user.id,
      budget_min: parsed.data.budget_min,
      budget_max: parsed.data.budget_max,
    });
  }

  // Upsert vibe vote
  const { data: existingVibe } = await admin
    .from("vibe_votes")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const vibeUpdate = {
    vibes: parsed.data.vibes,
    interest_tags: parsed.data.interest_tags ?? [],
  };

  if (existingVibe) {
    await admin.from("vibe_votes").update(vibeUpdate).eq("id", existingVibe.id);
  } else {
    await admin.from("vibe_votes").insert({
      trip_id: trip.id,
      user_id: user.id,
      ...vibeUpdate,
    });
  }

  // Update trip's group-level budget/vibes aggregates
  // Recompute overlap for trip update
  const { data: allBudgets } = await admin
    .from("budget_votes")
    .select("budget_min, budget_max")
    .eq("trip_id", trip.id);

  let overlapMin = 0;
  let overlapMax = Infinity;
  for (const v of allBudgets ?? []) {
    overlapMin = Math.max(overlapMin, v.budget_min);
    overlapMax = Math.min(overlapMax, v.budget_max);
  }

  if ((allBudgets ?? []).length >= 2 && overlapMin <= overlapMax) {
    await admin.from("trips").update({
      budget_min: overlapMin,
      budget_max: overlapMax,
    }).eq("id", trip.id);
  }

  // Update trip vibes + interest_tags (top-voted)
  const { data: allVibes } = await admin.from("vibe_votes").select("vibes, interest_tags").eq("trip_id", trip.id);
  const vibeCount: Record<string, number> = {};
  const tagCount: Record<string, number> = {};
  for (const v of allVibes ?? []) {
    for (const vibe of v.vibes) {
      vibeCount[vibe] = (vibeCount[vibe] ?? 0) + 1;
    }
    for (const tag of v.interest_tags ?? []) {
      tagCount[tag] = (tagCount[tag] ?? 0) + 1;
    }
  }
  const topVibes = Object.entries(vibeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([v]) => v);
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([t]) => t);

  await admin.from("trips").update({ vibes: topVibes, interest_tags: topTags }).eq("id", trip.id);

  return NextResponse.json({ ok: true });
}
