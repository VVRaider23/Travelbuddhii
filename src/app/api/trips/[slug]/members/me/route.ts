import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

// A caller may only ever edit their own row, so there is no user_id in the body.
const ProfileSchema = z.object({
  display_name: z.string().trim().min(1).max(40),
  // Basic UPI handle shape: local@provider. Kept permissive because banks keep
  // inventing new provider suffixes.
  upi_id: z
    .string()
    .trim()
    .regex(/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/, "That does not look like a UPI ID")
    .optional()
    .or(z.literal("")),
});

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

  const parsed = ProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: trip } = await admin.from("trips").select("id").eq("slug", slug).single();
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: updated, error } = await admin
    .from("trip_members")
    .update({
      display_name: parsed.data.display_name,
      upi_id: parsed.data.upi_id ? parsed.data.upi_id : null,
    })
    .eq("trip_id", trip.id)
    .eq("user_id", user.id)
    .select("user_id, display_name, upi_id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not save your details" }, { status: 500 });
  }
  // No row updated means the caller is not in this trip.
  if (!updated) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, member: updated });
}
