import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidLockRange, type DateVote } from "@/lib/dateOverlap";
import { z } from "zod";

const LockSchema = z.object({
  confirmed_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  confirmed_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = LockSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid dates" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: trip } = await admin
    .from("trips")
    .select("id, status, date_window_start, date_window_end")
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

  // The window has to sit inside the poll the group was actually asked about.
  if (
    (trip.date_window_start && parsed.data.confirmed_start < trip.date_window_start) ||
    (trip.date_window_end && parsed.data.confirmed_end > trip.date_window_end)
  ) {
    return NextResponse.json(
      { error: "Those dates fall outside the trip's voting window." },
      { status: 422 }
    );
  }

  // The organizer picks from windows the group agreed on. Until now this was
  // only checked in the browser, so any range at all could be posted here and
  // days half the group said they were busy would end up locked in.
  const { data: votes } = await admin
    .from("date_votes")
    .select("user_id, date, is_available")
    .eq("trip_id", trip.id);

  if (!isValidLockRange((votes ?? []) as DateVote[], parsed.data.confirmed_start, parsed.data.confirmed_end)) {
    return NextResponse.json(
      {
        error:
          "Those dates include days the group did not agree on. Pick one of the suggested windows.",
      },
      { status: 422 }
    );
  }

  await admin
    .from("trips")
    .update({
      confirmed_start: parsed.data.confirmed_start,
      confirmed_end: parsed.data.confirmed_end,
      status: "voting",
    })
    .eq("id", trip.id);

  return NextResponse.json({ ok: true });
}

/**
 * Unlock the dates so the group can vote again.
 *
 * Locking is presented to the organizer as something that stops everyone else
 * editing, which means it needs a way back. Without this, one misclick freezes
 * a trip's dates permanently.
 */
export async function DELETE(
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
    .select("id, confirmed_start")
    .eq("slug", slug)
    .single();

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

  if (!trip.confirmed_start) {
    return NextResponse.json({ error: "Dates are not locked." }, { status: 409 });
  }

  // Back to gathering_inputs: the dates step is unfinished again, and the step
  // bar derives its state from real trip data rather than from status.
  await admin
    .from("trips")
    .update({
      confirmed_start: null,
      confirmed_end: null,
      status: "gathering_inputs",
    })
    .eq("id", trip.id);

  return NextResponse.json({ ok: true });
}
