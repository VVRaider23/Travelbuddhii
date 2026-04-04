"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const TABS = [
  { label: "Dates", icon: "🗓️", path: "dates" },
  { label: "Budget", icon: "💰", path: "budget" },
  { label: "Destination", icon: "🗺️", path: "destinations" },
  { label: "Itinerary", icon: "✈️", path: "itinerary" },
  { label: "Expenses", icon: "💸", path: "expenses" },
];

export function TripNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(-1);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 safe-area-pb z-40"
      style={{
        background: "rgba(255,255,255,0.95)",
        borderTop: "1px solid rgba(0,0,0,0.05)",
        backdropFilter: "blur(16px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex">
        {TABS.map((tab, i) => {
          const href = `/t/${slug}/${tab.path}`;
          const isActive = pathname === href;

          return (
            <Link
              key={tab.path}
              href={href}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(-1)}
              className="flex-1 flex flex-col items-center justify-center relative"
              style={{ minHeight: 56, padding: "8px 0 6px", gap: 3, transition: "all 0.2s ease" }}
            >
              {isActive && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-[3px] rounded-b-[4px]"
                  style={{ background: "linear-gradient(90deg, var(--tb-orange), var(--tb-orange-light))" }}
                />
              )}
              <div
                className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[19px]"
                style={{
                  background: isActive ? "rgba(255,107,53,0.1)" : "transparent",
                  transform: isActive || hovered === i ? "scale(1.08)" : "scale(1)",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.icon}
              </div>
              <span
                className="text-[10px]"
                style={{
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--tb-orange)" : "var(--tb-light)",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
