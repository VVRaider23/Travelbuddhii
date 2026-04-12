import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const WindowSchema = z.object({
  date_window_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_window_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function PUT(
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
  const parsed = WindowSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid dates" }, { status: 400 });

  if (parsed.data.date_window_start >= parsed.data.date_window_end) {
    return NextResponse.json({ error: "Start must be before end" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: trip } = await admin
    .from("trips")
    .select("id, status")
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

  await admin
    .from("trips")
    .update({
      date_window_start: parsed.data.date_window_start,
      date_window_end: parsed.data.date_window_end,
    })
    .eq("id", trip.id);

  return NextResponse.json({ ok: true });
}
