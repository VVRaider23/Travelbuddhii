"use client";

import { usePathname } from "next/navigation";
import { TripNav } from "./TripNav";

export function ConditionalNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const isDashboard = pathname === `/t/${slug}`;

  if (isDashboard) return null;

  return <TripNav slug={slug} />;
}
