import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const VoteSchema = z.object({
  // Array of destination IDs in rank order (index 0 = rank 1 = most preferred)
  ranking: z.array(z.string().uuid()).min(1),
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

// GET — fetch destinations + votes
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
    admin.from("destination_votes").select("user_id, destination_id, rank").eq("trip_id", trip.id),
    admin.from("trip_members").select("user_id, role").eq("trip_id", trip.id),
  ]);

  // Compute Borda count tally
  const destList = destinations ?? [];
  const voteList = votes ?? [];
  const n = destList.length;

  const bordaScores: Record<string, number> = {};
  for (const dest of destList) bordaScores[dest.id] = 0;

  for (const vote of voteList) {
    // rank 1 = n-1 points, rank 2 = n-2 points, etc.
    bordaScores[vote.destination_id] = (bordaScores[vote.destination_id] ?? 0) + (n - vote.rank);
  }

  // My ranking
  const myVotes = voteList
    .filter((v: { user_id: string }) => v.user_id === user.id)
    .sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank)
    .map((v: { destination_id: string }) => v.destination_id);

  return NextResponse.json({
    trip,
    destinations: destList,
    bordaScores,
    myRanking: myVotes,
    voters: [...new Set(voteList.map((v: { user_id: string }) => v.user_id))],
    members: members ?? [],
  });
}

// POST — submit ranked vote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = VoteSchema.safeParse(body);
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

  // Delete old votes, insert new ranked votes
  await admin
    .from("destination_votes")
    .delete()
    .eq("trip_id", trip.id)
    .eq("user_id", user.id);

  await admin.from("destination_votes").insert(
    parsed.data.ranking.map((destId: string, i: number) => ({
      trip_id: trip.id,
      user_id: user.id,
      destination_id: destId,
      rank: i + 1,
    }))
  );

  return NextResponse.json({ ok: true });
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
    .select("name")
    .eq("id", destination_id)
    .single();
  if (!dest) return NextResponse.json({ error: "Destination not found" }, { status: 404 });

  await admin.from("trips").update({
    destination: dest.name,
    status: "planning",
  }).eq("id", trip.id);

  return NextResponse.json({ ok: true, destination: dest.name });
}
