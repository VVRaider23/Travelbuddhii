import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const ExpenseSchema = z.object({
  amount: z.number().positive().max(10000000),
  description: z.string().min(1).max(200),
  category: z.string().default("other"),
  // split_with: array of user_ids. If empty, defaults to all members (equal split)
  split_with: z.array(z.string()).optional(),
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

// GET — fetch expenses + splits + settlements
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
  const { data: trip } = await admin.from("trips").select("id").eq("slug", slug).single();
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ data: expenses }, { data: members }] = await Promise.all([
    admin.from("expenses").select("*, expense_splits(*)").eq("trip_id", trip.id).order("created_at"),
    admin.from("trip_members").select("user_id, role").eq("trip_id", trip.id),
  ]);

  return NextResponse.json({
    expenses: expenses ?? [],
    members: members ?? [],
    currentUserId: user.id,
  });
}

// POST — add expense with equal split
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = ExpenseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: trip } = await admin.from("trips").select("id").eq("slug", slug).single();
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: membership } = await admin
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", trip.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Determine who to split with
  let splitWith = parsed.data.split_with;
  if (!splitWith || splitWith.length === 0) {
    const { data: members } = await admin
      .from("trip_members")
      .select("user_id")
      .eq("trip_id", trip.id);
    splitWith = (members ?? []).map((m: { user_id: string }) => m.user_id);
  }

  // Insert expense
  const { data: expense } = await admin
    .from("expenses")
    .insert({
      trip_id: trip.id,
      paid_by: user.id,
      amount: parsed.data.amount,
      description: parsed.data.description,
      category: parsed.data.category,
    })
    .select("id")
    .single();

  if (!expense) return NextResponse.json({ error: "Could not create expense" }, { status: 500 });

  // Equal split
  const splitWithFinal = splitWith ?? [];
  if (splitWithFinal.length === 0) return NextResponse.json({ error: "No split targets" }, { status: 400 });
  const perPerson = parsed.data.amount / splitWithFinal.length;
  await admin.from("expense_splits").insert(
    splitWithFinal.map((uid: string) => ({
      expense_id: expense.id,
      user_id: uid,
      amount: parseFloat(perPerson.toFixed(2)),
      is_settled: uid === user.id, // payer's own split is auto-settled
    }))
  );

  // Log event
  await admin.from("event_logs").insert({
    trip_id: trip.id,
    user_id: user.id,
    event_type: "expense_added",
    metadata: { amount: parsed.data.amount },
  });

  return NextResponse.json({ ok: true });
}
