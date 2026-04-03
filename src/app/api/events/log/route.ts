import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, trip_id, user_id, metadata } = body;

    if (!event_type) {
      return NextResponse.json({ error: "event_type required" }, { status: 400 });
    }

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("event_logs") as any).insert({
      event_type,
      trip_id: trip_id ?? null,
      user_id: user_id ?? null,
      metadata: metadata ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Non-critical — never let analytics break the app
    return NextResponse.json({ ok: true });
  }
}
