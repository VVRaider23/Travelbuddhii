"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTripStore } from "@/store/tripStore";
import { ItineraryItem, type ItineraryItemData } from "@/components/itinerary/ItineraryItem";
import { ChatEditor } from "@/components/itinerary/ChatEditor";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

interface DayTheme {
  day: number;
  theme: string;
}

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

export default function ItineraryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const userRole = useTripStore((s) => s.userRole);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [items, setItems] = useState<ItineraryItemData[]>([]);
  const [dayThemes, setDayThemes] = useState<DayTheme[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [trip, setTrip] = useState<{ destination: string | null; confirmed_start: string | null; confirmed_end: string | null } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${slug}/itinerary/chat`);
      const data = await res.json();
      setTrip(data.trip);
      setItems(data.items ?? []);
      setChatMessages(data.messages ?? []);
      if (data.items?.length > 0) {
        const days = [...new Set((data.items as ItineraryItemData[]).map((i) => i.day_number))];
        setDayThemes(days.map((d) => ({ day: d, theme: "" })));
      }
    } catch {
      toast.error("Could not load itinerary");
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch(`/api/trips/${slug}/itinerary/generate`, {
      method: "POST",
    });

    const data = await res.json();
    setGenerating(false);

    if (!res.ok) {
      toast.error(data.error ?? "Generation failed. Try again.");
      return;
    }

    setItems(data.items ?? []);
    setDayThemes(data.dayThemes ?? []);
    if (data.items?.length > 0) setSelectedDay(1);
    toast.success("Itinerary generated!");
  }

  const days = [...new Set(items.map((i) => i.day_number))].sort((a, b) => a - b);
  const currentDayItems = items
    .filter((i) => i.day_number === selectedDay)
    .sort((a, b) => a.position - b.position);

  const dayLabel = (day: number) => {
    const theme = dayThemes.find((d) => d.day === day)?.theme;
    return theme ? `Day ${day}: ${theme}` : `Day ${day}`;
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-col pb-6 min-h-screen">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Itinerary</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {trip?.destination ?? "Building your plan..."}
            </p>
          </div>
          {items.length > 0 && (
            <ChatEditor
              slug={slug}
              onItineraryUpdated={loadData}
              messages={chatMessages}
              onNewMessage={(msg) => setChatMessages((prev) => [...prev, msg])}
            />
          )}
        </div>
      </div>

      {/* No itinerary — generate CTA */}
      {items.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div className="text-5xl">✈️</div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">Build your itinerary</h2>
            <p className="text-sm text-gray-400 mt-1">
              {trip?.destination
                ? `AI will create a day-by-day plan for ${trip.destination}`
                : "Set a destination first to generate an itinerary"}
            </p>
          </div>

          {trip?.destination && (
            <motion.button
              onClick={handleGenerate}
              disabled={generating}
              whileTap={{ scale: 0.97 }}
              className="w-full max-w-xs py-4 rounded-2xl text-white font-semibold text-base disabled:opacity-50"
              style={{ backgroundColor: "#25D366" }}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block">⟳</span>
                  Building your plan...
                </span>
              ) : (
                "✨ Generate Itinerary (AI)"
              )}
            </motion.button>
          )}
        </div>
      )}

      {/* Itinerary view */}
      {items.length > 0 && (
        <>
          {/* Day tabs */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide bg-white border-b border-gray-100">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedDay === day
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {dayLabel(day)}
              </button>
            ))}
          </div>

          {/* Day items */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-2 p-4"
            >
              {currentDayItems.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No items for this day</p>
              ) : (
                currentDayItems.map((item) => (
                  <ItineraryItem key={item.id} item={item} />
                ))
              )}
            </motion.div>
          </AnimatePresence>

          {/* Regenerate */}
          <div className="px-4 mt-auto">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm disabled:opacity-50"
            >
              {generating ? "Regenerating..." : "Regenerate from scratch"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
