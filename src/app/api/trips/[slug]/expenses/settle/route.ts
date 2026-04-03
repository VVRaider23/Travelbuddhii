import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const SettleSchema = z.object({
  expense_split_ids: z.array(z.string().uuid()).min(1),
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
  const parsed = SettleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  // Verify membership
  const { data: trip } = await admin.from("trips").select("id").eq("slug", slug).single();
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await admin
    .from("expense_splits")
    .update({ is_settled: true, settled_at: new Date().toISOString() })
    .in("id", parsed.data.expense_split_ids)
    .eq("user_id", user.id);

  // Log event
  await admin.from("event_logs").insert({
    trip_id: trip.id,
    user_id: user.id,
    event_type: "settlement_link_opened",
  });

  return NextResponse.json({ ok: true });
}
