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
    <header className="fixed top-0 left-0 right-0 z-40 h-[52px] flex items-center justify-between px-4"
      style={{
        background: "rgba(255,255,255,0.92)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        backdropFilter: "blur(16px)",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <Link
        href="/"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-medium"
        style={{ color: "var(--tb-light)" }}
      >
        ← Home
      </Link>

      <div className="flex items-center gap-1.5 max-w-[200px] overflow-hidden">
        <div
          className="w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))" }}
        >
          <span className="font-playfair text-[11px] font-black text-white">T</span>
        </div>
        <span className="text-sm font-semibold truncate" style={{ color: "var(--tb-text)" }}>
          {tripName ?? ""}
        </span>
      </div>

      <button
        onClick={handleLogout}
        className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:text-red-400"
        style={{ color: "var(--tb-light)" }}
      >
        Logout
      </button>
    </header>
  );
}
