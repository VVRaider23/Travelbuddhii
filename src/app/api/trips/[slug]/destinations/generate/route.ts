import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  recommend,
  type CatalogEntry,
  type OffbeatExperience,
  type RecommendationContext,
} from "@/lib/recommendation";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  // Fetch trip context
  const { data: trip } = await admin
    .from("trips")
    .select("id, status, confirmed_start, confirmed_end, budget_min, budget_max, vibes, interest_tags, departing_city, date_window_start, date_window_end")
    .eq("slug", slug)
    .single();

  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify organizer
  const { data: membership } = await admin
    .from("trip_members")
    .select("role")
    .eq("trip_id", trip.id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Organizer only" }, { status: 403 });
  }

  // Get member count
  const { count: memberCount } = await admin
    .from("trip_members")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", trip.id);

  // Build recommendation context
  const budgetMin = trip.budget_min ?? 20000;
  const budgetMax = trip.budget_max ?? 40000;
  const startDate = trip.confirmed_start ?? trip.date_window_start;

  // Extract travel month (0-indexed)
  let month = new Date().getMonth(); // default to current month
  if (startDate) {
    month = new Date(startDate).getMonth();
  }

  const ctx: RecommendationContext = {
    month,
    vibes: trip.vibes ?? [],
    interestTags: trip.interest_tags ?? [],
    budgetMin,
    budgetMax,
    memberCount: memberCount ?? 5,
    departingCity: trip.departing_city ?? undefined,
  };

  // Fetch catalog + offbeat data in parallel
  const [catalogRes, offbeatRes] = await Promise.all([
    admin.from("destination_catalog").select("*"),
    admin.from("offbeat_experiences").select("*"),
  ]);

  const catalog: CatalogEntry[] = catalogRes.data ?? [];
  const offbeatAll: OffbeatExperience[] = offbeatRes.data ?? [];

  // Group offbeat by destination name
  const offbeatByDest: Record<string, OffbeatExperience[]> = {};
  for (const exp of offbeatAll) {
    if (!offbeatByDest[exp.destination]) offbeatByDest[exp.destination] = [];
    offbeatByDest[exp.destination].push(exp);
  }

  // Run recommendation engine
  const recommendations = recommend(catalog, offbeatByDest, ctx, 5);

  if (recommendations.length === 0) {
    return NextResponse.json({ error: "No destinations match your preferences for this time of year. Try adjusting dates or vibes." }, { status: 400 });
  }

  // Delete old AI destinations and insert new ones
  await admin.from("destinations").delete().eq("trip_id", trip.id).eq("ai_generated", true);

  const toInsert = recommendations.map((d) => ({
    trip_id: trip.id,
    name: d.name,
    pitch: d.pitch,
    estimated_cost_min: d.cost_min,
    estimated_cost_max: d.cost_max,
    pros: d.pros,
    cons: d.cons,
    travel_options: d.travelFromCity ? [d.travelFromCity] : d.travel_options.slice(0, 3),
    google_place_id: d.google_place_id,
    photo_url: d.photo_url,
    coordinates: d.lat && d.lng ? `(${d.lng},${d.lat})` : null,
    ai_generated: true,
    offbeat_experiences: d.offbeat,
    seasonality_note: d.seasonNote,
  }));

  const { data: inserted } = await admin.from("destinations").insert(toInsert).select("*");

  // Merge extra fields back for response
  const result = (inserted ?? []).map((row: { id: string; name: string }, i: number) => ({
    ...row,
    photo_url: recommendations[i]?.photo_url ?? null,
    why_fits_group: recommendations[i]?.whyFitsGroup ?? null,
    season_score: recommendations[i]?.seasonScore ?? null,
    offbeat_experiences: recommendations[i]?.offbeat ?? [],
  }));

  // Log event
  await admin.from("event_logs").insert({
    trip_id: trip.id,
    user_id: user.id,
    event_type: "destination_voted",
    metadata: { action: "generate", count: result.length },
  });

  return NextResponse.json({ destinations: result });
}
