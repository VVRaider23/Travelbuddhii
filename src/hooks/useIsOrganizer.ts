"use client";

import { useTripStore } from "@/store/tripStore";

export function useIsOrganizer() {
  const userRole = useTripStore((s) => s.userRole);
  return userRole === "organizer";
}
