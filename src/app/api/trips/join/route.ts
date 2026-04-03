import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const JoinSchema = z.object({ slug: z.string().min(1) });

export async function POST(request: NextRequest) {
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
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = JoinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: trip } = await admin
    .from("trips")
    .select("id")
    .eq("slug", parsed.data.slug)
    .single();

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  // Enforce 15-member cap
  const { count } = await admin
    .from("trip_members")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", trip.id);

  if ((count ?? 0) >= 15) {
    return NextResponse.json(
      { error: "This trip has reached the maximum of 15 members." },
      { status: 409 }
    );
  }

  // Idempotent insert — ignore if already a member
  const { data: existing } = await admin
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", trip.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    await admin.from("trip_members").insert({
      trip_id: trip.id,
      user_id: user.id,
      role: "member",
    });

    // Log event
    await admin.from("event_logs").insert({
      trip_id: trip.id,
      user_id: user.id,
      event_type: "trip_joined",
    });
  }

  return NextResponse.json({ success: true });
}
