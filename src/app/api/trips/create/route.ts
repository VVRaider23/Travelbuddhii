import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/slug";
import { z } from "zod";

const CreateTripSchema = z.object({
  name: z.string().min(1).max(80),
  date_window_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_window_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

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
  const parsed = CreateTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, date_window_start, date_window_end } = parsed.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  // Generate slug with collision retry (up to 3 attempts)
  let slug = "";
  for (let i = 0; i < 3; i++) {
    const candidate = generateSlug(name);
    const { data } = await admin
      .from("trips")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) {
      slug = candidate;
      break;
    }
  }

  if (!slug) {
    return NextResponse.json(
      { error: "Could not generate a unique slug. Try again." },
      { status: 500 }
    );
  }

  const { data: trip, error } = await admin
    .from("trips")
    .insert({
      slug,
      name,
      created_by: user.id,
      date_window_start,
      date_window_end,
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add organizer to trip_members
  await admin.from("trip_members").insert({
    trip_id: trip.id,
    user_id: user.id,
    role: "organizer",
  });

  // Initialize date_poll_config
  await admin.from("date_poll_config").insert({
    trip_id: trip.id,
    is_anonymous: false,
  });

  return NextResponse.json({ slug: trip.slug });
}
