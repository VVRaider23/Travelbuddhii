import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOpenAI } from "@/lib/openai";
import { searchPlace, buildPhotoUrl } from "@/lib/places";
import { DestinationSuggestionSchema } from "@/types/ai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

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
    .select("id, status, confirmed_start, confirmed_end, budget_min, budget_max, vibes, date_window_start, date_window_end")
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

  // Get budget overlap from budget_votes if trip.budget_min/max not set
  let budgetMin = trip.budget_min ?? 20000;
  let budgetMax = trip.budget_max ?? 40000;

  const startDate = trip.confirmed_start ?? trip.date_window_start;
  const endDate = trip.confirmed_end ?? trip.date_window_end;

  let nights = 3;
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    nights = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const vibesList = (trip.vibes ?? []).join(", ") || "adventure, nature";

  // Call GPT-4o-mini with structured output
  const openai = getOpenAI();

  let parsed;
  try {
    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert Indian travel planner for domestic leisure trips.
Rules: ASI monuments close Mondays. Indian road travel = Google Maps × 2.5. Always include veg + non-veg options. Monsoon (Jun-Aug) limits hill station/coastal access. Return ONLY valid JSON matching the schema.`,
        },
        {
          role: "user",
          content: `Plan for ${memberCount ?? 5} Indian friends (25-35).
Budget: ₹${budgetMin}–${budgetMax}/person. Duration: ${nights} nights.
Vibes: ${vibesList}. Dates: ${startDate ?? "flexible"}–${endDate ?? "flexible"}.
Departing from: India (major city).
Suggest 3-5 destinations within India with per-person all-inclusive cost estimate (NOT flights).`,
        },
      ],
      response_format: zodResponseFormat(DestinationSuggestionSchema, "destinations"),
    });

    parsed = completion.choices[0].message.parsed;
  } catch (err) {
    console.error("GPT error:", err);
    return NextResponse.json({ error: "AI generation failed. Try again." }, { status: 500 });
  }

  if (!parsed) return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });

  // Validate places via Google Places API + fetch photos (parallel, non-fatal)
  const destinationsWithPlaces = await Promise.all(
    parsed.destinations.map(async (dest) => {
      const placeResult = await searchPlace(dest.name, dest.state ?? "India");
      return {
        ...dest,
        google_place_id: placeResult?.placeId ?? null,
        photo_url: placeResult?.photoName
          ? buildPhotoUrl(placeResult.photoName)
          : null,
        coordinates: placeResult
          ? `(${placeResult.lng},${placeResult.lat})`
          : null,
      };
    })
  );

  // Delete old AI destinations and insert new ones
  await admin.from("destinations").delete().eq("trip_id", trip.id).eq("ai_generated", true);

  const toInsert = destinationsWithPlaces.map((d) => ({
    trip_id: trip.id,
    name: d.name,
    pitch: d.pitch,
    estimated_cost_min: d.estimated_cost_min,
    estimated_cost_max: d.estimated_cost_max,
    pros: d.pros,
    cons: d.cons,
    travel_options: d.travel_options,
    google_place_id: d.google_place_id,
    ai_generated: true,
  }));

  const { data: inserted } = await admin.from("destinations").insert(toInsert).select("*");

  // Merge photo_urls back (not in DB — returned only in this response)
  const result = (inserted ?? []).map((row: { id: string; name: string }, i: number) => ({
    ...row,
    photo_url: destinationsWithPlaces[i]?.photo_url ?? null,
    why_fits_group: destinationsWithPlaces[i]?.why_fits_group ?? null,
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
