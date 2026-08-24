import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TripStoreProvider } from "@/components/layout/TripStoreProvider";
import { TripHeader } from "@/components/layout/TripHeader";
import { TripProgressBar } from "@/components/layout/TripProgressBar";
import { JoinPage } from "@/components/trip/JoinPage";
import { getStepStates } from "@/lib/tripProgress";

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
  const { data: membersData, error: membersError } = await admin
    .from("trip_members")
    .select("user_id, role, joined_at, display_name, avatar_url, upi_id")
    .eq("trip_id", trip.id);

  // A failed member query must not be mistaken for "you are not a member".
  // Swallowing it would show the join screen to the entire existing group,
  // which is exactly what happens if migration 003 has not been applied yet.
  if (membersError) {
    throw new Error(
      `Could not load trip members: ${membersError.message}. ` +
        "If this mentions a missing column, apply supabase/migrations/003_named_members.sql."
    );
  }

  // Two cheap count queries so the progress bar reflects what actually exists,
  // rather than trips.status, which nothing ever advances past "planning".
  const [{ count: itineraryItemCount }, { count: expenseCount }] = await Promise.all([
    admin.from("itinerary_items").select("*", { count: "exact", head: true }).eq("trip_id", trip.id),
    admin.from("expenses").select("*", { count: "exact", head: true }).eq("trip_id", trip.id),
  ]);

  const stepStates = getStepStates({
    confirmedStart: trip.confirmed_start,
    budgetMin: trip.budget_min ?? null,
    destination: trip.destination,
    itineraryItemCount: itineraryItemCount ?? 0,
    expenseCount: expenseCount ?? 0,
  });

  const members = membersData ?? [];
  const myMembership = members.find((m: { user_id: string }) => m.user_id === user.id);

  // Non-members get the join screen rendered right here. Do NOT redirect: this
  // layout wraps the trip page, so any redirect back into /t/<slug> re-enters
  // this same check and loops until the browser gives up.
  if (!myMembership) {
    return (
      <JoinPage
        slug={slug}
        tripName={trip.name}
        memberCount={members.length}
        destination={trip.destination}
      />
    );
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
      budgetMin={trip.budget_min ?? null}
      budgetMax={trip.budget_max ?? null}
      tripVibes={trip.vibes ?? []}
      members={members}
      stepStates={stepStates}
    >
      <div className="flex flex-col min-h-screen" style={{ background: "var(--tb-cream)", width: "100%", maxWidth: 480, margin: "0 auto" }}>
        <TripHeader />
        <TripProgressBar slug={slug} states={stepStates} />
        {/* Top padding clears the 52px header plus the ~47px progress bar.
            Bottom padding clears the sticky StepFooter each page renders. */}
        <main className="flex-1 pt-[99px] pb-24">{children}</main>
      </div>
    </TripStoreProvider>
  );
}
