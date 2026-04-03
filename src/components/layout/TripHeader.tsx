"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTripStore } from "@/store/tripStore";

export function TripHeader() {
  const router = useRouter();
  const tripName = useTripStore((s) => s.tripName);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-40 h-12 flex items-center justify-between px-4">
      <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1">
        ← Home
      </Link>
      <span className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
        {tripName ?? ""}
      </span>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-400 hover:text-red-500 transition-colors"
      >
        Logout
      </button>
    </header>
  );
}
