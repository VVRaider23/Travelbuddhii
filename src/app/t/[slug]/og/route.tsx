import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const [{ data: trip }, { data: tripForId }] = await Promise.all([
    admin.from("trips").select("name, destination, confirmed_start, confirmed_end, status").eq("slug", slug).single(),
    admin.from("trips").select("id").eq("slug", slug).single(),
  ]);

  const tripId = tripForId?.id ?? "";
  const { count: memberCount } = await admin
    .from("trip_members")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId);

  const tripName = trip?.name ?? "Group Trip";
  const destination = trip?.destination;
  const members = memberCount ?? 0;

  const dateStr =
    trip?.confirmed_start && trip?.confirmed_end
      ? `${new Date(trip.confirmed_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(trip.confirmed_end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #fde68a 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ fontSize: "20px", color: "#f97316", fontWeight: "700", marginBottom: "24px", letterSpacing: "0.05em" }}>
          TRIPSYNC
        </div>

        {/* Trip name */}
        <div style={{ fontSize: "64px", fontWeight: "800", color: "#111827", lineHeight: 1.1, marginBottom: "24px" }}>
          {tripName}
        </div>

        {/* Meta chips */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {destination && (
            <div style={{ background: "#25D366", color: "white", padding: "8px 20px", borderRadius: "100px", fontSize: "20px", fontWeight: "600" }}>
              📍 {destination}
            </div>
          )}
          {dateStr && (
            <div style={{ background: "white", color: "#374151", padding: "8px 20px", borderRadius: "100px", fontSize: "20px", border: "2px solid #e5e7eb" }}>
              🗓️ {dateStr}
            </div>
          )}
          <div style={{ background: "white", color: "#374151", padding: "8px 20px", borderRadius: "100px", fontSize: "20px", border: "2px solid #e5e7eb" }}>
            👥 {members} {members === 1 ? "person" : "people"} planning
          </div>
        </div>

        {/* Bottom */}
        <div style={{ position: "absolute", bottom: "40px", right: "60px", fontSize: "18px", color: "#9ca3af" }}>
          tripsync.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
