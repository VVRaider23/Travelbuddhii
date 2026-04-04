"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";

const WHAT_NEXT = [
  { icon: "🔗", text: "Your group opens the link" },
  { icon: "🗳️", text: "Everyone votes on dates & budget" },
  { icon: "✨", text: "AI generates the perfect itinerary" },
];

export default function NewTripPage() {
  const [tripName, setTripName] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(165deg, var(--tb-cream) 0%, #FFF5E8 40%, var(--tb-sand) 100%)" }}
    >
      {/* Floating orbs */}
      <div
        className="absolute pointer-events-none animate-float"
        style={{ top: -60, right: -40, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.15) 0%, transparent 70%)" }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ bottom: "5%", left: -50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,168,168,0.12) 0%, transparent 70%)", animation: "float 10s ease-in-out infinite" }}
      />

      <div className="w-full max-w-md relative z-10">
        <AnimatePresence mode="wait">
          {!created ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="rounded-[28px] p-7 flex flex-col gap-6"
              style={{
                background: "rgba(255,255,255,0.95)",
                border: "1px solid rgba(0,0,0,0.04)",
                boxShadow: "0 16px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))", boxShadow: "0 3px 12px rgba(255,107,53,0.3)" }}
                >
                  <span className="font-playfair text-[16px] font-black text-white">T</span>
                </div>
                <div>
                  <h1 className="text-[22px] font-bold leading-tight" style={{ color: "var(--tb-text)" }}>
                    New trip ✈️
                  </h1>
                  <p className="text-[13px]" style={{ color: "var(--tb-muted)" }}>
                    Your group votes on the rest
                  </p>
                </div>
              </div>

              {/* Trip name */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold" style={{ color: "var(--tb-text)" }}>
                  Trip name
                </label>
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Goa with the gang 🏖️"
                  className="w-full text-[16px] font-medium rounded-[16px] outline-none transition-all duration-300"
                  style={{
                    padding: "16px 18px",
                    color: "var(--tb-text)",
                    background: "rgba(0,0,0,0.015)",
                    border: "2px solid rgba(0,0,0,0.06)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--tb-orange)";
                    e.target.style.boxShadow = "0 0 0 4px rgba(255,107,53,0.1)";
                    e.target.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(0,0,0,0.06)";
                    e.target.style.boxShadow = "none";
                    e.target.style.background = "rgba(0,0,0,0.015)";
                  }}
                  autoFocus
                />
              </div>

              {/* Date window */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold" style={{ color: "var(--tb-text)" }}>
                  Possible dates{" "}
                  <span className="font-normal" style={{ color: "var(--tb-light)" }}>(optional)</span>
                </label>
                <p className="text-[12px]" style={{ color: "var(--tb-light)" }}>
                  Date range your group votes within. Skip and add later.
                </p>
                <Popover>
                  <PopoverTrigger
                    className="w-full text-left rounded-[14px] transition-all duration-200"
                    style={{
                      padding: "12px 16px",
                      background: "rgba(0,0,0,0.015)",
                      border: "2px solid rgba(0,0,0,0.06)",
                      fontSize: 14,
                      color: dateRange?.from ? "var(--tb-text)" : "var(--tb-light)",
                    }}
                  >
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          📅 {format(dateRange.from, "d MMM")} → {format(dateRange.to, "d MMM yyyy")}
                        </>
                      ) : (
                        <>📅 From {format(dateRange.from, "d MMM yyyy")}</>
                      )
                    ) : (
                      "Pick a date window e.g. last week of March"
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

              {/* CTA */}
              <button
                onClick={handleCreate}
                disabled={loading || !tripName.trim()}
                className="w-full flex items-center justify-center gap-2.5 text-white font-bold text-[16px] rounded-[18px] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                style={{
                  padding: "17px 24px",
                  background: "linear-gradient(135deg, #25D366 0%, #2EE07A 100%)",
                  boxShadow: "0 4px 16px rgba(37,211,102,0.25)",
                }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {loading ? "Creating..." : "Create & Share on WhatsApp"}
              </button>

              {/* Trust */}
              <p className="text-center text-[12px]" style={{ color: "var(--tb-light)" }}>
                No app download needed · Share via WhatsApp · ₹0 to plan
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="rounded-[28px] p-7 flex flex-col gap-5 text-center"
              style={{
                background: "rgba(255,255,255,0.95)",
                border: "1px solid rgba(0,0,0,0.04)",
                boxShadow: "0 16px 60px rgba(0,0,0,0.08)",
              }}
            >
              {/* Confetti emoji */}
              <div
                className="text-[56px] animate-bounceIn"
                style={{ lineHeight: 1 }}
              >
                🎉
              </div>

              <div>
                <h2 className="text-[24px] font-bold" style={{ color: "var(--tb-text)" }}>
                  Trip created!
                </h2>
                <p className="text-[14px] mt-1" style={{ color: "var(--tb-muted)" }}>
                  Share this link — your group votes on dates & budget
                </p>
              </div>

              {/* Copy link */}
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-3 rounded-[14px] w-full text-left transition-all"
                style={{
                  background: copied ? "rgba(37,211,102,0.06)" : "rgba(0,0,0,0.02)",
                  border: `1px solid ${copied ? "rgba(37,211,102,0.2)" : "rgba(0,0,0,0.05)"}`,
                }}
              >
                <span className="text-sm">🔗</span>
                <span
                  className="flex-1 text-[12px] font-medium overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{ color: "var(--tb-muted)" }}
                >
                  {shareUrl}
                </span>
                <span
                  className="text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-md"
                  style={{
                    color: copied ? "#25D366" : "var(--tb-orange)",
                    background: copied ? "rgba(37,211,102,0.08)" : "rgba(255,107,53,0.08)",
                  }}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </span>
              </button>

              {/* WhatsApp share */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center justify-center gap-2.5 text-white font-bold text-[16px] rounded-[18px] transition-all hover:-translate-y-0.5"
                style={{
                  padding: "17px 24px",
                  background: "linear-gradient(135deg, #25D366 0%, #2EE07A 100%)",
                  boxShadow: "0 4px 16px rgba(37,211,102,0.25)",
                }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share on WhatsApp
              </button>

              {/* What happens next */}
              <div
                className="rounded-[16px] p-4 text-left"
                style={{ background: "rgba(0,0,0,0.015)", border: "1px solid rgba(0,0,0,0.04)" }}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--tb-light)" }}>
                  What happens next
                </p>
                <div className="flex flex-col gap-2.5">
                  {WHAT_NEXT.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-[13px] font-medium" style={{ color: "var(--tb-text)" }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push(`/t/${created}`)}
                className="text-[14px] font-semibold transition-colors hover:opacity-70"
                style={{ color: "var(--tb-orange)" }}
              >
                View trip dashboard →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
