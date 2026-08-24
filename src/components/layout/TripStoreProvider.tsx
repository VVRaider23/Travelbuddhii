"use client";

import { useEffect } from "react";
import { useTripStore, type TripMember } from "@/store/tripStore";
import type { TripStatus, MemberRole } from "@/types/database";
import type { StepState } from "@/lib/tripProgress";

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
  members: TripMember[];
  stepStates: Record<string, StepState>;
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
  stepStates,
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
      members,
      stepStates,
    });
  }, [tripId, tripSlug, tripName, tripStatus, userRole, currentUserId, dateWindowStart, dateWindowEnd, confirmedStart, confirmedEnd, budgetMin, budgetMax, tripVibes, members, stepStates, setTripData]);

  return <>{children}</>;
}
