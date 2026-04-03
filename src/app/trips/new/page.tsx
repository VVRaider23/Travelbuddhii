"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";

export default function NewTripPage() {
  const [tripName, setTripName] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const router = useRouter();

  // Restore trip name from homepage input
  useEffect(() => {
    const pending = sessionStorage.getItem("pending_trip_name");
    if (pending) {
      setTripName(pending);
      sessionStorage.removeItem("pending_trip_name");
    }
  }, []);

  async function handleCreate() {
    if (!tripName.trim()) {
      toast.error("Give your trip a name first");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/trips/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: tripName.trim(),
        date_window_start: dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined,
        date_window_end: dateRange?.to
          ? format(dateRange.to, "yyyy-MM-dd")
          : undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Something went wrong. Try again.");
      return;
    }

    setCreated(data.slug);
  }

  const shareUrl = created
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/t/${created}`
    : null;

  function handleWhatsAppShare() {
    if (!shareUrl) return;
    const msg = `Hey! I'm planning a trip and need your input. Takes 2 minutes 👇\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {!created ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6"
            >
              <div>
                <h1 className="text-2xl font-bold text-gray-900">New trip</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Fill in the basics — your group votes on the rest
                </p>
              </div>

              {/* Trip name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Trip name
                </label>
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Goa with the gang"
                  className="w-full px-4 py-3.5 text-lg rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  autoFocus
                />
              </div>

              {/* Date window (optional) */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Possible dates{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <p className="text-xs text-gray-400">
                  The date range your group will vote within. You can skip this and add later.
                </p>
                <Popover>
                  <PopoverTrigger className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-left text-sm hover:bg-gray-50 transition-colors">
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <span className="text-gray-900">
                          {format(dateRange.from, "d MMM")} →{" "}
                          {format(dateRange.to, "d MMM yyyy")}
                        </span>
                      ) : (
                        <span className="text-gray-900">
                          From {format(dateRange.from, "d MMM yyyy")}
                        </span>
                      )
                    ) : (
                      <span className="text-gray-400">
                        Pick a date window e.g. &quot;last week of March&quot;
                      </span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      disabled={{ before: new Date() }}
                      fromDate={new Date()}
                      toDate={addDays(new Date(), 365)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading || !tripName.trim()}
                className="w-full py-4 rounded-2xl text-white font-semibold text-base disabled:opacity-50 transition-all"
                style={{ backgroundColor: "#25D366" }}
              >
                {loading ? "Creating..." : "Create Trip →"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-5 text-center"
            >
              <div className="text-5xl">🎉</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Trip created!
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Share this link with your group. They&apos;ll vote on dates and budget.
                </p>
              </div>

              {/* Share link display */}
              <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2">
                <span className="flex-1 text-sm text-gray-600 truncate">
                  {shareUrl}
                </span>
                <button
                  onClick={copyLink}
                  className="text-xs text-orange-500 font-medium shrink-0"
                >
                  Copy
                </button>
              </div>

              {/* WhatsApp share */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2"
                style={{ backgroundColor: "#25D366" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
                Share on WhatsApp
              </button>

              <button
                onClick={() => router.push(`/t/${created}`)}
                className="text-sm text-orange-500 font-medium"
              >
                View trip →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
