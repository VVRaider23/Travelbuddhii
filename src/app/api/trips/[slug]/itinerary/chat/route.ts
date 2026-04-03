import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOpenAI } from "@/lib/openai";
import { ItinerarySchema } from "@/types/ai";
import { z } from "zod";

const ChatSchema = z.object({
  message: z.string().min(1).max(500),
});

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

  const body = await request.json();
  const parsed = ChatSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: trip } = await admin
    .from("trips")
    .select("id, destination, confirmed_start, confirmed_end, budget_min, budget_max, vibes")
    .eq("slug", slug)
    .single();
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  // Fetch current itinerary
  const { data: currentItems } = await admin
    .from("itinerary_items")
    .select("*")
    .eq("trip_id", trip.id)
    .order("day_number")
    .order("position");

  // Get recent chat history (last 10)
  const { data: chatHistory } = await admin
    .from("chat_messages")
    .select("role, content")
    .eq("trip_id", trip.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const openai = getOpenAI();

  // Group items by day for context
  const itineraryByDay: Record<number, typeof currentItems> = {};
  for (const item of currentItems ?? []) {
    if (!itineraryByDay[item.day_number]) itineraryByDay[item.day_number] = [];
    itineraryByDay[item.day_number].push(item);
  }

  const systemPrompt = `You are an itinerary editing assistant for a group trip to ${trip.destination}.
Current itinerary: ${JSON.stringify(itineraryByDay)}
Member count: ${memberCount ?? 5}. Budget: ₹${trip.budget_min ?? 20000}–${trip.budget_max ?? 40000}/person.
All Indian travel rules apply (ASI Monday closures, road time multipliers, etc.)

If the user requests a modification: respond conversationally (1-2 sentences) then output the FULL updated itinerary as JSON in a \`\`\`json code block with this exact structure: {"days": [{"day_number": N, "theme": "...", "items": [{...}]}]}
If informational: answer conversationally only.`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...(chatHistory ?? []).reverse().map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: parsed.data.message },
  ];

  let assistantContent: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });
    assistantContent = completion.choices[0].message.content ?? "";
  } catch (err) {
    console.error("GPT error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }

  // Save chat messages
  await admin.from("chat_messages").insert([
    { trip_id: trip.id, user_id: user.id, content: parsed.data.message, role: "user" },
    { trip_id: trip.id, user_id: null, content: assistantContent, role: "assistant" },
  ]);

  // Log event
  await admin.from("event_logs").insert({
    trip_id: trip.id,
    user_id: user.id,
    event_type: "chat_message_sent",
  });

  // Try to parse a JSON block from the assistant response
  const jsonMatch = assistantContent.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) {
    return NextResponse.json({ reply: assistantContent, itineraryUpdated: false });
  }

  let newItinerary;
  try {
    newItinerary = ItinerarySchema.parse(JSON.parse(jsonMatch[1]));
  } catch {
    return NextResponse.json({ reply: assistantContent, itineraryUpdated: false });
  }

  // Save snapshot
  if ((currentItems ?? []).length > 0) {
    await admin.from("itinerary_snapshots").insert({
      trip_id: trip.id,
      snapshot: currentItems,
      created_by: user.id,
    });
  }

  // Delete old + insert new
  await admin.from("itinerary_items").delete().eq("trip_id", trip.id);

  const toInsert = newItinerary.days.flatMap((day) =>
    day.items.map((item, pos) => ({
      trip_id: trip.id,
      day_number: day.day_number,
      position: pos,
      place_name: item.place_name,
      category: item.category,
      notes: item.notes ?? null,
      start_time: item.start_time ?? null,
      duration_minutes: item.duration_minutes,
    }))
  );

  const { data: inserted } = await admin
    .from("itinerary_items")
    .insert(toInsert)
    .select("*");

  return NextResponse.json({
    reply: assistantContent.replace(/```json[\s\S]*?```/g, "").trim(),
    itineraryUpdated: true,
    items: inserted ?? [],
  });
}

// GET — fetch chat history + current itinerary
export async function GET(
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
  const { data: trip } = await admin.from("trips").select("id, destination, confirmed_start, confirmed_end").eq("slug", slug).single();
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: items }, { data: messages }] = await Promise.all([
    admin.from("itinerary_items").select("*").eq("trip_id", trip.id).order("day_number").order("position"),
    admin.from("chat_messages").select("id, role, content, created_at").eq("trip_id", trip.id).order("created_at"),
  ]);

  return NextResponse.json({
    trip,
    items: items ?? [],
    messages: messages ?? [],
  });
}
