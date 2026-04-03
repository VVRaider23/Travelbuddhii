"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ProductDemo } from "./ProductDemo";

export function HeroSection() {
  const [tripName, setTripName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleCreate() {
    if (!tripName.trim()) {
      inputRef.current?.focus();
      return;
    }

    setLoading(true);

    // Check auth state
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Preserve trip name across OAuth redirect
      sessionStorage.setItem("pending_trip_name", tripName.trim());
      router.push(`/login?redirect=/trips/new`);
      return;
    }

    // Already authed — go straight to create
    sessionStorage.setItem("pending_trip_name", tripName.trim());
    router.push("/trips/new");
  }

  return (
    <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-4 overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-lg w-full">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 leading-tight">
            Plan your next group trip{" "}
            <span className="text-orange-500">without the chaos</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            One link. Everyone votes. You go.
          </p>
        </motion.div>

        {/* Animated product demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full"
        >
          <ProductDemo />
        </motion.div>

        {/* Trip name input + CTA — auth deferred */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-full flex flex-col gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Give your trip a name..."
            className="w-full px-4 py-4 text-lg rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
            autoComplete="off"
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-semibold text-lg transition-all disabled:opacity-60"
            style={{ backgroundColor: "#25D366" }}
          >
            {loading ? "Just a moment..." : "Create a Trip →"}
          </button>
          <p className="text-sm text-gray-400">
            No app download needed · Share via WhatsApp
          </p>
        </motion.div>
      </div>
    </section>
  );
}
