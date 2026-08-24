import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOpenAI } from "@/lib/openai";
import { validatePlaces } from "@/lib/places";
import { datesInRange } from "@/lib/dateOverlap";
import { ItinerarySchema } from "@/types/ai";

export async function POST(
  request: NextRequest,
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

  const { data: trip } = await admin
    .from("trips")
    .select("id, status, destination, confirmed_start, confirmed_end, budget_min, budget_max, vibes")
    .eq("slug", slug)
    .single();

  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!trip.destination) return NextResponse.json({ error: "No destination set" }, { status: 400 });

  // Verify membership
  const { data: membership } = await admin
    .from("trip_members")
    .select("role")
    .eq("trip_id", trip.id)
    .eq("user_id", user.id)
    .single();
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { count: memberCount } = await admin
    .from("trip_members")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", trip.id);

  const startDate = trip.confirmed_start;
  const endDate = trip.confirmed_end;
  let days = 3;
  if (startDate && endDate) {
    // Both ends are days on the trip, so Sep 2 to Sep 7 is six days, not five.
    // This used to compute nights and hand them over as days, which cut a day
    // off every generated plan.
    days = Math.max(1, datesInRange(startDate, endDate).length);
  } else {
    const body = await request.json().catch(() => ({}));
    if (body.customDays && typeof body.customDays === "number") {
      days = Math.min(10, Math.max(1, body.customDays));
    }
  }

  // The group's budget is whatever the budget step settled on: the tightest
  // ceiling anyone submitted. When nobody has set one, say so rather than
  // substituting a number the group never agreed to, which is what the old
  // `?? 40000` did on every trip with a null budget.
  const budgetLine =
    trip.budget_max !== null
      ? `Hard cap Rs${trip.budget_max.toLocaleString("en-IN")} per person. This is the lowest budget in the group, so nothing may exceed it.`
      : "The group has not set a budget. Keep costs modest and state the approximate cost of each item.";

  const openai = getOpenAI();

  let parsed;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a meticulous Indian travel itinerary planner. Return ONLY a JSON code block with no other text.
Rules:
- ASI monuments CLOSED Mondays
- Road travel × 2.5 of Google estimate
- Day 1: arrival + light activities only
- Last day: checkout 11am
- Cluster geographically: all Day N activities within 30-min drive
- Include veg AND non-veg meal options each day
- Group size ${memberCount ?? 5}: group-compatible activities only
- Budget: ${budgetLine}

JSON structure:
{"days":[{"day_number":1,"theme":"...","area":"...","items":[{"place_name":"...","category":"activity|meal|transport|accommodation","start_time":"HH:MM or null","duration_minutes":60,"notes":"...","booking_platform":"makemytrip|irctc|redbus|zomato|direct|none|null","search_query":"... or null","is_offbeat":true,"how_to_get_there":"... or null"}]}]}`,
        },
        {
          role: "user",
          content: `Generate a ${days}-day itinerary for ${trip.destination}. ${budgetLine} Vibes: ${(trip.vibes ?? []).join(", ") || "adventure, nature"}. Dates: ${startDate ?? "flexible"} to ${endDate ?? "flexible"}. Include 1 accommodation, 3-4 activities, 2-3 meals, and transport items per day. Return all ${days} days.`,
        },
      ],
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content ?? "";
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ?? content.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) throw new Error("No JSON in response");
    parsed = ItinerarySchema.parse(JSON.parse(jsonMatch[1]));
  } catch (err) {
    console.error("GPT error:", err);
    return NextResponse.json({ error: "AI generation failed. Try again." }, { status: 500 });
  }

  if (!parsed) return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });

  // Build the replacement completely before touching what is already there.
  //
  // This used to delete the existing itinerary first and then call out to the
  // Places API, so any failure in between left the trip with no plan at all and
  // nothing on screen to explain where it went.
  const allPlaces = parsed.days.flatMap((d: { items: { place_name: string }[] }) =>
    d.items.map((item) => ({ name: item.place_name }))
  );
  const placeResults = await validatePlaces(allPlaces, trip.destination);

  let placeIndex = 0;
  const itemsToInsert = [];

  for (const day of parsed.days) {
    for (let pos = 0; pos < day.items.length; pos++) {
      const item = day.items[pos];
      const place = placeResults[placeIndex++];

      itemsToInsert.push({
        trip_id: trip.id,
        day_number: day.day_number,
        position: pos,
        place_name: item.place_name,
        place_id: place?.placeId ?? null,
        category: item.category,
        notes: item.notes ?? null,
        start_time: item.start_time ?? null,
        duration_minutes: item.duration_minutes,
      });
    }
  }

  if (itemsToInsert.length === 0) {
    return NextResponse.json(
      { error: "The plan came back empty. Try again." },
      { status: 502 }
    );
  }

  // Snapshot what is being replaced, so a regenerate the group dislikes is
  // recoverable.
  const { data: existing } = await admin
    .from("itinerary_items")
    .select("*")
    .eq("trip_id", trip.id);

  if (existing && existing.length > 0) {
    await admin.from("itinerary_snapshots").insert({
      trip_id: trip.id,
      snapshot: existing,
      created_by: user.id,
    });
  }

  await admin.from("itinerary_items").delete().eq("trip_id", trip.id);

  const { data: inserted, error: insertError } = await admin
    .from("itinerary_items")
    .insert(itemsToInsert)
    .select("*");

  // The old rows are already gone at this point. Put them back rather than
  // leaving the trip empty.
  if (insertError) {
    if (existing && existing.length > 0) {
      await admin.from("itinerary_items").insert(existing);
    }
    return NextResponse.json(
      { error: "Could not save the new plan. Your previous itinerary is intact." },
      { status: 500 }
    );
  }

  // Log event
  await admin.from("event_logs").insert({
    trip_id: trip.id,
    user_id: user.id,
    event_type: "itinerary_viewed",
    metadata: { action: "generate", days: parsed.days.length },
  });

  return NextResponse.json({
    items: inserted ?? [],
    dayThemes: parsed.days.map((d: { day_number: number; theme: string }) => ({
      day: d.day_number,
      theme: d.theme,
    })),
  });
}
