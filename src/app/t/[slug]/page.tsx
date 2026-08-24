import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TripDashboard } from "@/components/trip/TripDashboard";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: trip } = await admin
    .from("trips")
    .select("id, name, destination, confirmed_start, confirmed_end")
    .eq("slug", slug)
    .single();

  if (!trip) return { title: "Trip not found — TripSync" };

  const { count } = await admin
    .from("trip_members")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", trip.id);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  return {
    title: `${trip.name} — TripSync`,
    description: `Join ${trip.name} on TripSync. ${count ?? 0} people are already planning.`,
    openGraph: {
      title: trip.name,
      description: `${count ?? 0} people are planning this trip. Join them!`,
      images: [
        {
          url: `${baseUrl}/t/${slug}/og`,
          width: 1200,
          height: 630,
        },
      ],
      url: `${baseUrl}/t/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: trip.name,
      description: `${count ?? 0} people are planning this trip. Join them!`,
      images: [`${baseUrl}/t/${slug}/og`],
    },
  };
}

export default async function TripPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: trip } = await admin
    .from("trips")
    .select("id, name, status, destination, confirmed_start, confirmed_end, budget_min, budget_max, vibes")
    .eq("slug", slug)
    .single();

  if (!trip) redirect("/");

  const { data: members } = await admin
    .from("trip_members")
    .select("user_id, role, joined_at, display_name, avatar_url")
    .eq("trip_id", trip.id);

  const memberList = members ?? [];

  // Non-members never get this far: the layout above renders the join screen
  // before this page runs. Membership is enforced in exactly one place.
  return (
    <TripDashboard
      slug={slug}
      trip={trip}
      members={memberList}
      currentUserId={user!.id}
    />
  );
}
