"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Dates", icon: "🗓️", path: "dates" },
  { label: "Budget", icon: "💰", path: "budget" },
  { label: "Destination", icon: "🗺️", path: "destinations" },
  { label: "Itinerary", icon: "✈️", path: "itinerary" },
  { label: "Expenses", icon: "💸", path: "expenses" },
];

export function TripNav({ slug }: { slug: string }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-pb z-40">
      <div className="flex">
        {TABS.map((tab) => {
          const href = `/t/${slug}/${tab.path}`;
          const isActive = pathname === href;

          return (
            <Link
              key={tab.path}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] gap-0.5 transition-colors ${
                isActive ? "text-orange-500" : "text-gray-400"
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className={`text-[10px] font-medium ${isActive ? "text-orange-500" : "text-gray-400"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-orange-500 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
