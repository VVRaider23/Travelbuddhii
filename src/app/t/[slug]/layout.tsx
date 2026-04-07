import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TripStoreProvider } from "@/components/layout/TripStoreProvider";
import { ConditionalNav } from "@/components/layout/ConditionalNav";
import { TripHeader } from "@/components/layout/TripHeader";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function TripLayout({ children, params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/t/${slug}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  // Fetch trip
  const { data: trip } = await admin
    .from("trips")
    .select("id, slug, name, status, date_window_start, date_window_end, confirmed_start, confirmed_end, destination, budget_min, budget_max, vibes")
    .eq("slug", slug)
    .single();

  if (!trip) {
    redirect("/");
  }

  // Fetch members
  const { data: membersData } = await admin
    .from("trip_members")
    .select("user_id, role, joined_at")
    .eq("trip_id", trip.id);

  const members = membersData ?? [];
  const myMembership = members.find((m: { user_id: string }) => m.user_id === user.id);

  // Not a member yet — they need to join via the landing page
  if (!myMembership) {
    redirect(`/t/${slug}?join=1`);
  }

  return (
    <TripStoreProvider
      tripId={trip.id}
      tripSlug={trip.slug}
      tripName={trip.name}
      tripStatus={trip.status}
      userRole={myMembership.role}
      currentUserId={user.id}
      dateWindowStart={trip.date_window_start}
      dateWindowEnd={trip.date_window_end}
      confirmedStart={trip.confirmed_start}
      confirmedEnd={trip.confirmed_end}
      members={members}
    >
      <div className="flex flex-col min-h-screen" style={{ background: "var(--tb-cream)", maxWidth: 480, margin: "0 auto" }}>
        <TripHeader />
        <main className="flex-1 pt-[52px] pb-20">{children}</main>
        <ConditionalNav slug={slug} />
      </div>
    </TripStoreProvider>
  );
}
