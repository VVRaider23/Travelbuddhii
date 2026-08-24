import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const SaveDatesSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

// GET — fetch all votes + poll config for this trip
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

  const { data: trip } = await admin
    .from("trips")
    .select("id, date_window_start, date_window_end, confirmed_start, confirmed_end, status")
    .eq("slug", slug)
    .single();

  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: votes }, { data: config }, { data: members }] = await Promise.all([
    admin.from("date_votes").select("user_id, date, is_available").eq("trip_id", trip.id),
    admin.from("date_poll_config").select("is_anonymous, deadline").eq("trip_id", trip.id).single(),
    admin.from("trip_members").select("user_id, role").eq("trip_id", trip.id),
  ]);

  return NextResponse.json({
    trip,
    votes: votes ?? [],
    config: config ?? { is_anonymous: false, deadline: null },
    members: members ?? [],
  });
}

// POST — upsert date votes for current user
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
  const parsed = SaveDatesSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: trip } = await admin
    .from("trips")
    .select("id, confirmed_start")
    .eq("slug", slug)
    .single();

  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify membership
  const { data: membership } = await admin
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", trip.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // The organizer is warned that locking stops everyone else changing their
  // dates. Until now that was only true in the browser: this endpoint accepted
  // votes just fine after a lock, so the warning was a promise nothing kept.
  if (trip.confirmed_start) {
    return NextResponse.json(
      { error: "Dates are locked for this trip. Ask the organizer to unlock them." },
      { status: 409 }
    );
  }

  // Delete old votes, insert new ones
  await admin.from("date_votes").delete().eq("trip_id", trip.id).eq("user_id", user.id);

  if (parsed.data.dates.length > 0) {
    await admin.from("date_votes").insert(
      parsed.data.dates.map((date: string) => ({
        trip_id: trip.id,
        user_id: user.id,
        date,
        is_available: true,
      }))
    );
  }

  // Log event
  await admin.from("event_logs").insert({
    trip_id: trip.id,
    user_id: user.id,
    event_type: "date_vote_completed",
  });

  return NextResponse.json({ ok: true });
}

// PATCH — toggle anonymous mode (organizer only)
export async function PATCH(
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: membership } = await admin
    .from("trip_members")
    .select("role, trip_id")
    .eq("user_id", user.id)
    .eq("trip_id",
      (await admin.from("trips").select("id").eq("slug", slug).single()).data?.id ?? ""
    )
    .single();

  if (!membership || membership.role !== "organizer") {
    return NextResponse.json({ error: "Organizer only" }, { status: 403 });
  }

  await admin
    .from("date_poll_config")
    .update({ is_anonymous: body.is_anonymous })
    .eq("trip_id", membership.trip_id);

  return NextResponse.json({ ok: true });
}
