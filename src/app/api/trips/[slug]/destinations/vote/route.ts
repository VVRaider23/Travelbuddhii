import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  outcome,
  type DestinationVote,
  type DestinationLike,
} from "@/lib/destinationOutcome";
import { z } from "zod";

const PicksSchema = z.object({
  picks: z.array(z.string().uuid()).max(2),
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

// GET — fetch destinations + vote counts
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

  const { data: trip } = await admin
    .from("trips")
    .select("id, status, destination")
    .eq("slug", slug)
    .single();
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: destinations }, { data: votes }, { data: members }] = await Promise.all([
    admin.from("destinations").select("*").eq("trip_id", trip.id).order("created_at"),
    admin.from("destination_votes").select("user_id, destination_id").eq("trip_id", trip.id),
    admin.from("trip_members").select("user_id, role").eq("trip_id", trip.id),
  ]);

  const destList = destinations ?? [];
  const voteList = votes ?? [];

  // Simple vote count per destination
  const voteCounts: Record<string, number> = {};
  for (const dest of destList) voteCounts[dest.id] = 0;
  for (const vote of voteList) {
    voteCounts[vote.destination_id] = (voteCounts[vote.destination_id] ?? 0) + 1;
  }

  // My picks
  const myPicks = voteList
    .filter((v: { user_id: string }) => v.user_id === user.id)
    .map((v: { destination_id: string }) => v.destination_id);

  return NextResponse.json({
    trip,
    destinations: destList,
    voteCounts,
    myPicks,
    voters: [...new Set(voteList.map((v: { user_id: string }) => v.user_id))],
    members: members ?? [],
    // Decided server-side so the page renders the same answer the vote route
    // acts on, rather than recomputing it and possibly disagreeing.
    outcome: outcome(
      voteList as DestinationVote[],
      destList as DestinationLike[],
      (members ?? []).length
    ),
  });
}

// POST — submit 1-2 picks
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = PicksSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

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

  // Delete old votes
  await admin
    .from("destination_votes")
    .delete()
    .eq("trip_id", trip.id)
    .eq("user_id", user.id);

  // Insert new picks (if any)
  if (parsed.data.picks.length > 0) {
    await admin.from("destination_votes").insert(
      parsed.data.picks.map((destId: string) => ({
        trip_id: trip.id,
        user_id: user.id,
        destination_id: destId,
        rank: 1,
      }))
    );
  }

  // Once everyone has voted, the most-voted place wins without anyone having to
  // press a button. Nothing used to set trips.destination except an explicit
  // organizer action, and a trip that never got one was stuck: the itinerary
  // step refuses to generate without a destination.
  //
  // A tie writes nothing. The organizer settles it through PATCH below.
  const [{ data: allVotes }, { data: destinations }, { count: memberCount }] =
    await Promise.all([
      admin.from("destination_votes").select("user_id, destination_id").eq("trip_id", trip.id),
      admin.from("destinations").select("id, name").eq("trip_id", trip.id),
      admin.from("trip_members").select("*", { count: "exact", head: true }).eq("trip_id", trip.id),
    ]);

  const result = outcome(
    (allVotes ?? []) as DestinationVote[],
    (destinations ?? []) as DestinationLike[],
    memberCount ?? 0
  );

  if (result.kind === "winner") {
    await admin
      .from("trips")
      .update({ destination: result.destination.name, status: "planning" })
      .eq("id", trip.id);
  }

  return NextResponse.json({ ok: true, outcome: result });
}

// PATCH — lock destination (organizer only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { destination_id } = body;
  if (!destination_id) return NextResponse.json({ error: "destination_id required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: trip } = await admin.from("trips").select("id").eq("slug", slug).single();
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: membership } = await admin
    .from("trip_members")
    .select("role")
    .eq("trip_id", trip.id)
    .eq("user_id", user.id)
    .single();
  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Organizer only" }, { status: 403 });
  }

  const { data: dest } = await admin
    .from("destinations")
    .select("id, name")
    .eq("id", destination_id)
    .eq("trip_id", trip.id)
    .maybeSingle();
  if (!dest) return NextResponse.json({ error: "Destination not found" }, { status: 404 });

  // When the vote came out tied, the organizer breaks the tie and nothing more.
  // Picking a place the group ranked below the leaders would make the vote
  // decorative, so it is rejected rather than silently honoured.
  const [{ data: allVotes }, { data: destinations }, { count: memberCount }] =
    await Promise.all([
      admin.from("destination_votes").select("user_id, destination_id").eq("trip_id", trip.id),
      admin.from("destinations").select("id, name").eq("trip_id", trip.id),
      admin.from("trip_members").select("*", { count: "exact", head: true }).eq("trip_id", trip.id),
    ]);

  const result = outcome(
    (allVotes ?? []) as DestinationVote[],
    (destinations ?? []) as DestinationLike[],
    memberCount ?? 0
  );

  if (result.kind === "tie" && !result.tied.some((d) => d.id === dest.id)) {
    return NextResponse.json(
      {
        error: `The vote is tied between ${result.tied.map((d) => d.name).join(" and ")}. Pick one of those.`,
      },
      { status: 422 }
    );
  }

  await admin.from("trips").update({
    destination: dest.name,
    status: "planning",
  }).eq("id", trip.id);

  return NextResponse.json({ ok: true, destination: dest.name });
}
