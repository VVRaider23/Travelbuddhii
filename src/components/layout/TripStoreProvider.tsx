"use client";

import { useEffect } from "react";
import { useTripStore, type TripMember } from "@/store/tripStore";
import type { TripStatus, MemberRole } from "@/types/database";

interface Props {
  tripId: string;
  tripSlug: string;
  tripName: string;
  tripStatus: TripStatus;
  userRole: MemberRole;
  currentUserId: string;
  dateWindowStart: string | null;
  dateWindowEnd: string | null;
  confirmedStart: string | null;
  confirmedEnd: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  tripVibes: string[];
  members: { user_id: string; role: MemberRole; joined_at: string }[];
  children: React.ReactNode;
}

export function TripStoreProvider({
  tripId,
  tripSlug,
  tripName,
  tripStatus,
  userRole,
  currentUserId,
  dateWindowStart,
  dateWindowEnd,
  confirmedStart,
  confirmedEnd,
  budgetMin,
  budgetMax,
  tripVibes,
  members,
  children,
}: Props) {
  const setTripData = useTripStore((s) => s.setTripData);

  useEffect(() => {
    setTripData({
      tripId,
      tripSlug,
      tripName,
      tripStatus,
      userRole,
      currentUserId,
      dateWindowStart,
      dateWindowEnd,
      confirmedStart,
      confirmedEnd,
      budgetMin,
      budgetMax,
      tripVibes,
      members: members.map((m) => ({
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
      })) as TripMember[],
    });
  }, [tripId, tripSlug, tripName, tripStatus, userRole, currentUserId, dateWindowStart, dateWindowEnd, confirmedStart, confirmedEnd, budgetMin, budgetMax, tripVibes, members, setTripData]);

  return <>{children}</>;
}
