import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const LockSchema = z.object({
  confirmed_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  confirmed_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
  const parsed = LockSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid dates" }, { status: 400 });

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
      confirmed_start: parsed.data.confirmed_start,
      confirmed_end: parsed.data.confirmed_end,
      status: "voting",
    })
    .eq("id", trip.id);

  return NextResponse.json({ ok: true });
}
