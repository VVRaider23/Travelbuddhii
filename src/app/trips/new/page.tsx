"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

// ─── Data ────────────────────────────────────────────────────────────────────

const TRAVEL_ICONS = [
  { emoji: "✈️", animation: "flyAcross" },
  { emoji: "🚗", animation: "driveAcross" },
  { emoji: "🚂", animation: "chugAcross" },
  { emoji: "🛵", animation: "driveAcross" },
  { emoji: "⛵", animation: "flyAcross" },
];

const SUBTITLES = [
  "30 seconds to end the WhatsApp chaos 😌",
  "This is where the magic starts ✨",
  "Your friends are going to love this 😍",
  "No more 47 messages to pick a date 🙄",
  "One link, zero chaos 🙌",
];

const WHAT_NEXT = [
  { icon: "📩", text: "Friends open the link" },
  { icon: "🗳️", text: "Everyone votes on dates & budget" },
  { icon: "✨", text: "AI generates your perfect itinerary" },
];

// ─── Smart message generator ─────────────────────────────────────────────────

function generateMessage(name: string): string {
  if (!name) return "";
  const n = name.toLowerCase();
  if (n.includes("reunion") || n.includes("class") || n.includes("batch") || n.includes("school") || n.includes("alumni"))
    return `Guys it's happening!! ${name} trip is finally being planned! 🥳 Drop your dates & budget here, takes 2 min 👇`;
  if (n.includes("goa"))
    return `Goa trip loading... 🌴🍺 Vote on dates & budget so we can actually go this time! Takes 2 min 👇`;
  if (n.includes("manali") || n.includes("mountain") || n.includes("leh") || n.includes("ladakh") || n.includes("shimla") || n.includes("kasol") || n.includes("himachal"))
    return `Mountains are calling ⛰️❄️! Planning ${name} — vote on your dates & budget here. 2 min max 👇`;
  if (n.includes("boys") || n.includes("bro") || n.includes("ladke"))
    return `Boys trip is ON 🔥🔥! ${name} — drop your dates & budget here, no more WhatsApp chaos 👇`;
  if (n.includes("girls") || n.includes("bestie") || n.includes("bff") || n.includes("ladies"))
    return `It's finally happening!! 💕 ${name} is being planned. Vote on dates & budget — takes 2 min 👇`;
  if (n.includes("family") || n.includes("fam") || n.includes("parents") || n.includes("cousin"))
    return `Family trip time! 🏡❤️ Planning ${name} — everyone please vote on dates & budget here 👇`;
  if (n.includes("office") || n.includes("team") || n.includes("outing") || n.includes("offsite") || n.includes("work"))
    return `Team outing alert! 🎉 Planning ${name} — vote on your preferred dates & budget. Takes 2 minutes 👇`;
  if (n.includes("weekend") || n.includes("chill") || n.includes("getaway"))
    return `Weekend plans incoming 😎! ${name} — pick your dates & budget here so we can lock it in 👇`;
  if (n.includes("beach") || n.includes("pondi") || n.includes("kerala") || n.includes("andaman") || n.includes("gokarna"))
    return `Beach vibes loading 🏖️🌊! Planning ${name} — vote on dates & budget, takes 2 min 👇`;
  if (n.includes("rajasthan") || n.includes("udaipur") || n.includes("jaipur") || n.includes("jodhpur"))
    return `Royal trip alert 🏰✨! Planning ${name} — vote on your dates & budget here 👇`;
  return `Hey! Planning ${name} ✈️ Drop your preferred dates & budget here — takes 2 min, no app needed 👇`;
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function MiniCalendar({ selectedRange, onSelectRange }: {
  selectedRange: DateRange | undefined;
  onSelectRange: (r: DateRange | undefined) => void;
}) {
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m: number, y: number) => new Date(y, m, 1).getDay();

  const days = getDaysInMonth(viewMonth, viewYear);
  const firstDay = getFirstDay(viewMonth, viewYear);
  const today = new Date();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const toDate = (day: number) => new Date(viewYear, viewMonth, day);
  const todayFloor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const isPast = (day: number) => toDate(day) < todayFloor;
  const isInRange = (day: number) => {
    if (!selectedRange?.from) return false;
    const d = toDate(day);
    if (selectedRange.to) return d >= selectedRange.from && d <= selectedRange.to;
    return d.getTime() === selectedRange.from.getTime();
  };
  const isStart = (day: number) => selectedRange?.from?.getTime() === toDate(day).getTime();
  const isEnd = (day: number) => selectedRange?.to?.getTime() === toDate(day).getTime();

  const handleDayClick = (day: number) => {
    if (isPast(day)) return;
    const d = toDate(day);
    // Clicking start date with no end → deselect
    if (selectedRange?.from && !selectedRange.to && d.getTime() === selectedRange.from.getTime()) {
      onSelectRange(undefined);
      return;
    }
    if (!selectedRange?.from || selectedRange.to) {
      onSelectRange({ from: d, to: undefined });
    } else {
      if (d < selectedRange.from) {
        onSelectRange({ from: d, to: selectedRange.from });
      } else {
        onSelectRange({ from: selectedRange.from, to: d });
      }
    }
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div
      className="animate-scaleIn"
      style={{
        background: "#fff", borderRadius: 18,
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)",
        padding: "16px 14px", marginTop: 8,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button
          onClick={prevMonth}
          style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(0,0,0,0.06)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--tb-muted)" }}
        >‹</button>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--tb-text)" }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(0,0,0,0.06)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--tb-muted)" }}
        >›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--tb-light)", padding: "4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const inRange = isInRange(day);
          const start = isStart(day);
          const end = isEnd(day);
          const past = isPast(day);
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              disabled={past}
              style={{
                width: "100%", aspectRatio: "1",
                borderRadius: start || end ? 12 : (inRange ? 4 : 12),
                border: "none",
                cursor: past ? "default" : "pointer",
                background: start || end
                  ? "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))"
                  : inRange ? "rgba(255,107,53,0.1)" : "transparent",
                color: start || end ? "#fff" : past ? "#D0CBC5" : inRange ? "var(--tb-orange-dark)" : "var(--tb-text)",
                fontSize: 13, fontWeight: start || end ? 700 : 500,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s ease",
                opacity: past ? 0.4 : 1,
              }}
            >{day}</button>
          );
        })}
      </div>

      {/* Selected range feedback */}
      {selectedRange?.from && (
        <div className="animate-fadeIn" style={{
          marginTop: 12, padding: "8px 12px", borderRadius: 10,
          background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.12)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12 }}>📅</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--tb-orange)" }}>
              {selectedRange.from.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              {selectedRange.to && ` → ${selectedRange.to.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
            </span>
          </div>
          <button
            onClick={() => onSelectRange(undefined)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--tb-light)", fontWeight: 500, padding: "2px 6px" }}
          >✕ Clear</button>
        </div>
      )}
    </div>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function ConfettiParticles() {
  const colors = ["#FF6B35", "#00A8A8", "#25D366", "#8B5CF6", "#F59E0B", "#EC4899"];
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: 40 + (i * 17) % 320,
    y: -20 - (i * 11) % 100,
    size: 4 + (i % 3) * 2,
    color: colors[i % colors.length],
    delay: (i * 0.04),
    duration: 1.5 + (i % 4) * 0.3,
    shape: i % 2 === 0 ? "circle" : "rect",
  }));

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.x, top: p.y,
            width: p.size, height: p.shape === "rect" ? p.size * 1.5 : p.size,
            borderRadius: p.shape === "circle" ? "50%" : 2,
            background: p.color,
            animation: `confettiFall ${p.duration}s ease-out ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { opacity: 1; transform: translateY(0) translateX(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(400px) translateX(60px) rotate(720deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewTripPage() {
  const [tripName, setTripName] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeChip, setActiveChip] = useState(-1);
  const [departingCity, setDepartingCity] = useState("");
  const calendarSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!calendarOpen) return;
    const handler = (e: MouseEvent) => {
      if (calendarSectionRef.current && !calendarSectionRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calendarOpen]);
  const [editingMsg, setEditingMsg] = useState(false);
  const [customMsg, setCustomMsg] = useState("");
  const [subtitleIdx, setSubtitleIdx] = useState(0);
  const [subtitleVisible, setSubtitleVisible] = useState(true);
  const [iconIdx, setIconIdx] = useState(0);
  const [iconKey, setIconKey] = useState(0);
  const router = useRouter();

  // Restore trip name from homepage input
  useEffect(() => {
    const pending = sessionStorage.getItem("pending_trip_name");
    if (pending) {
      setTripName(pending);
      sessionStorage.removeItem("pending_trip_name");
    }
  }, []);

  // Rotating subtitle
  useEffect(() => {
    const t = setInterval(() => {
      setSubtitleVisible(false);
      setTimeout(() => {
        setSubtitleIdx(p => (p + 1) % SUBTITLES.length);
        setSubtitleVisible(true);
      }, 300);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  // Cycling travel icons
  useEffect(() => {
    const t = setInterval(() => {
      setIconIdx(p => (p + 1) % TRAVEL_ICONS.length);
      setIconKey(k => k + 1);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  const displayMessage = customMsg || generateMessage(tripName.trim());

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
        ...(departingCity ? { departing_city: departingCity } : {}),
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
    const msg = displayMessage
      ? `${displayMessage}\n${shareUrl}`
      : `Hey! I'm planning a trip and need your input. Takes 2 minutes 👇\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  }

  // Date chip helpers
  const DATE_CHIPS = [
    {
      label: "This weekend",
      getRange: (): DateRange => {
        const d = new Date();
        const sat = new Date(d);
        sat.setDate(d.getDate() + (6 - d.getDay()));
        const sun = new Date(sat);
        sun.setDate(sat.getDate() + 1);
        return { from: sat, to: sun };
      },
    },
    {
      label: "Next weekend",
      getRange: (): DateRange => {
        const d = new Date();
        const sat = new Date(d);
        sat.setDate(d.getDate() + (13 - d.getDay()));
        const sun = new Date(sat);
        sun.setDate(sat.getDate() + 1);
        return { from: sat, to: sun };
      },
    },
    {
      label: "Next long weekend",
      getRange: (): DateRange => {
        const d = new Date();
        const fri = new Date(d);
        fri.setDate(d.getDate() + (12 - d.getDay()));
        const mon = new Date(fri);
        mon.setDate(fri.getDate() + 3);
        return { from: fri, to: mon };
      },
    },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: "linear-gradient(165deg, var(--tb-cream) 0%, #FFF5E8 35%, #FFECD9 65%, var(--tb-sand) 100%)" }}
    >
      {/* Keyframes for icon animations */}
      <style>{`
        @keyframes flyAcross {
          0% { transform: translateX(-18px) translateY(4px) rotate(-5deg); opacity: 0; }
          15% { opacity: 1; }
          50% { transform: translateX(0px) translateY(-2px) rotate(3deg); opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(18px) translateY(-8px) rotate(10deg); opacity: 0; }
        }
        @keyframes driveAcross {
          0% { transform: translateX(18px) translateY(0); opacity: 0; }
          15% { opacity: 1; }
          50% { transform: translateX(0px) translateY(-1px); opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(-18px) translateY(0); opacity: 0; }
        }
        @keyframes chugAcross {
          0% { transform: translateX(18px); opacity: 0; }
          15% { opacity: 1; }
          30% { transform: translateX(8px) translateY(-1px); }
          50% { transform: translateX(0px) translateY(0); opacity: 1; }
          70% { transform: translateX(-6px) translateY(-1px); }
          85% { opacity: 1; }
          100% { transform: translateX(-18px); opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes copyFlash {
          0% { background: rgba(255,107,53,0.08); }
          50% { background: rgba(255,107,53,0.2); }
          100% { background: rgba(255,107,53,0.08); }
        }
      `}</style>

      {/* Floating orbs */}
      <div className="absolute pointer-events-none animate-float" style={{ top: -40, right: -30, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.12) 0%, transparent 70%)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "15%", left: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,168,168,0.1) 0%, transparent 70%)", animation: "float 10s ease-in-out infinite" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20px 20px, rgba(255,107,53,0.03) 2px, transparent 2px)", backgroundSize: "40px 40px" }} />

      <div className="w-full max-w-[420px] relative z-10">
        <AnimatePresence mode="wait">
          {!created ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              style={{
                background: "linear-gradient(145deg, #ffffff 0%, #FEFCF9 100%)",
                borderRadius: 24,
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 12px 48px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.03)",
                padding: "32px 28px",
                display: "flex", flexDirection: "column", gap: 24,
              }}
            >
              {/* Header */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: "linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,53,0.06))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, position: "relative", overflow: "hidden",
                  }}>
                    <span
                      key={iconKey}
                      style={{ display: "inline-block", animation: `${TRAVEL_ICONS[iconIdx].animation} 2.2s ease-in-out both` }}
                    >
                      {TRAVEL_ICONS[iconIdx].emoji}
                    </span>
                  </div>
                  <h1 className="font-playfair" style={{ fontSize: 26, fontWeight: 800, color: "var(--tb-text)" }}>
                    New trip
                  </h1>
                </div>
                <div style={{ height: 22, overflow: "hidden" }}>
                  <span
                    key={subtitleIdx}
                    style={{
                      display: "inline-block", fontSize: 14, color: "var(--tb-muted)", lineHeight: 1.5,
                      opacity: subtitleVisible ? 1 : 0,
                      transform: subtitleVisible ? "translateY(0)" : "translateY(-6px)",
                      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  >
                    {SUBTITLES[subtitleIdx]}
                  </span>
                </div>
              </div>

              {/* Trip name field */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--tb-text)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🏷️</span> Trip name
                </label>
                <div style={{
                  borderRadius: 16,
                  border: `2px solid ${nameFocused ? "var(--tb-orange)" : "rgba(0,0,0,0.06)"}`,
                  boxShadow: nameFocused ? "0 0 0 4px rgba(255,107,53,0.08), 0 2px 12px rgba(0,0,0,0.04)" : "0 1px 4px rgba(0,0,0,0.03)",
                  transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                  overflow: "hidden", background: "#fff",
                }}>
                  <input
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder="Goa with the gang"
                    autoFocus
                    style={{
                      width: "100%", padding: "16px 18px", fontSize: 16,
                      fontWeight: 500, color: "var(--tb-text)",
                      border: "none", outline: "none", background: "transparent",
                    }}
                  />
                </div>

                {/* Green checkmark feedback */}
                {tripName.trim() && (
                  <div className="animate-fadeIn" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="#25D366">
                      <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.41 5.29a.75.75 0 00-1.06-1.06L7 7.59 5.65 6.24a.75.75 0 10-1.06 1.06l1.88 1.88a.75.75 0 001.06 0l3.88-3.89z"/>
                    </svg>
                    <span style={{ fontSize: 12, color: "#25D366", fontWeight: 500 }}>Great name!</span>
                  </div>
                )}

                {/* WhatsApp preview bubble */}
                {tripName.trim() && (
                  <div className="animate-fadeUp" style={{
                    marginTop: 4, borderRadius: 16,
                    background: "#ECE5DD",
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8c0b5' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                    padding: 0, overflow: "hidden",
                  }}>
                    {/* WA header */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", background: "rgba(0,0,0,0.03)",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "var(--tb-muted)" }}>
                        <span style={{ fontSize: 12 }}>👀</span> Your friends will see this
                      </div>
                      <button
                        onClick={() => setEditingMsg(v => !v)}
                        style={{
                          background: editingMsg ? "rgba(255,107,53,0.12)" : "rgba(0,0,0,0.04)",
                          border: `1px solid ${editingMsg ? "rgba(255,107,53,0.3)" : "rgba(0,0,0,0.06)"}`,
                          borderRadius: 8, padding: "3px 10px",
                          fontSize: 11, fontWeight: 600,
                          color: editingMsg ? "var(--tb-orange)" : "var(--tb-muted)",
                          cursor: "pointer", transition: "all 0.2s ease",
                          display: "flex", alignItems: "center", gap: 4,
                        }}
                      >
                        {editingMsg ? <>✓ Done</> : <>✏️ Edit message</>}
                      </button>
                    </div>

                    {/* Chat bubble */}
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div style={{
                          maxWidth: "88%", width: "100%",
                          background: "#DCF8C6",
                          borderRadius: "10px 2px 10px 10px",
                          padding: "8px 11px 5px",
                          boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
                        }}>
                          {editingMsg ? (
                            <textarea
                              value={customMsg || displayMessage}
                              onChange={(e) => setCustomMsg(e.target.value)}
                              autoFocus
                              style={{
                                width: "100%", minHeight: 60, resize: "vertical",
                                fontSize: 13, color: "#303030", lineHeight: 1.4,
                                border: "1.5px dashed rgba(255,107,53,0.5)",
                                borderRadius: 8, padding: "8px 10px",
                                background: "rgba(255,255,255,0.6)",
                                outline: "none",
                              }}
                            />
                          ) : (
                            <div style={{ fontSize: 13, color: "#303030", lineHeight: 1.4 }}>
                              {displayMessage}
                            </div>
                          )}

                          {/* Link preview card */}
                          <div style={{ marginTop: 7, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", background: "#fff" }}>
                            <div style={{ height: 3, background: "linear-gradient(90deg, var(--tb-orange), var(--tb-orange-light), var(--tb-teal))" }} />
                            <div style={{ padding: "9px 11px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                                <div style={{ width: 14, height: 14, borderRadius: 4, background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span className="font-playfair" style={{ fontSize: 7, color: "#fff", fontWeight: 800 }}>T</span>
                                </div>
                                <span style={{ fontSize: 10.5, color: "var(--tb-light)" }}>travelbuddhii.app</span>
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tb-text)", marginBottom: 2 }}>{tripName.trim()}</div>
                              <div style={{ fontSize: 11.5, color: "var(--tb-muted)", lineHeight: 1.3 }}>Vote on dates & budget, get an AI-planned itinerary ✨</div>
                            </div>
                          </div>

                          {/* Timestamp */}
                          <div style={{ fontSize: 10, color: "#8696A0", textAlign: "right", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3 }}>
                            now
                            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                              <path d="M1 5.5L4 8.5L11 1.5" stroke="#53BDEB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M5 5.5L8 8.5L15 1.5" stroke="#53BDEB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Date section */}
              <div ref={calendarSectionRef} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "var(--tb-text)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15 }}>📅</span> When are you thinking?
                </label>

                {/* Quick-pick chips */}
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {DATE_CHIPS.map((chip, i) => {
                    const isActive = activeChip === i;
                    return (
                      <button
                        key={chip.label}
                        onClick={() => {
                          if (isActive) {
                            setActiveChip(-1);
                            setDateRange(undefined);
                          } else {
                            setActiveChip(i);
                            setDateRange(chip.getRange());
                            setCalendarOpen(false);
                          }
                        }}
                        style={{
                          padding: "9px 16px", borderRadius: 100,
                          border: `1.5px solid ${isActive ? "var(--tb-orange)" : "rgba(0,0,0,0.07)"}`,
                          background: isActive ? "linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,107,53,0.06))" : "#fff",
                          color: isActive ? "var(--tb-orange)" : "var(--tb-muted)",
                          fontSize: 13, fontWeight: isActive ? 600 : 500,
                          cursor: "pointer",
                          transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                          transform: isActive ? "scale(1.03)" : "scale(1)",
                          boxShadow: isActive ? "0 2px 10px rgba(255,107,53,0.15)" : "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                      >
                        {chip.label}
                      </button>
                    );
                  })}

                  {/* Pick dates chip */}
                  <button
                    onClick={() => {
                      setActiveChip(3);
                      setCalendarOpen(v => !v);
                    }}
                    style={{
                      padding: "9px 16px", borderRadius: 100,
                      border: `1.5px solid ${activeChip === 3 ? "var(--tb-orange)" : "rgba(0,0,0,0.07)"}`,
                      background: activeChip === 3 ? "linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,107,53,0.06))" : "#fff",
                      color: activeChip === 3 ? "var(--tb-orange)" : "var(--tb-muted)",
                      fontSize: 13, fontWeight: activeChip === 3 ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                      transform: activeChip === 3 ? "scale(1.03)" : "scale(1)",
                      boxShadow: activeChip === 3 ? "0 2px 10px rgba(255,107,53,0.15)" : "0 1px 3px rgba(0,0,0,0.03)",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <span style={{ fontSize: 12 }}>📅</span> Pick dates
                  </button>
                </div>

                {/* Selected chip feedback */}
                {activeChip >= 0 && activeChip < 3 && dateRange?.from && (
                  <div className="animate-fadeIn" style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: 12,
                    background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.12)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13 }}>✅</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tb-text)" }}>
                        {dateRange.from.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                        {dateRange.to && ` → ${dateRange.to.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`}
                      </span>
                    </div>
                    <button
                      onClick={() => { setActiveChip(-1); setDateRange(undefined); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--tb-light)", fontWeight: 500, padding: "2px 6px" }}
                    >✕</button>
                  </div>
                )}

                {/* Inline calendar */}
                {calendarOpen && (
                  <MiniCalendar
                    selectedRange={dateRange}
                    onSelectRange={(r) => setDateRange(r)}
                  />
                )}

                {/* Hint when no dates selected */}
                {!dateRange?.from && tripName.trim() && (
                  <p style={{ fontSize: 12.5, color: "var(--tb-light)", fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 11 }}>👆</span> Pick dates to continue
                  </p>
                )}
              </div>

              {/* Departing city */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--tb-text)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🚀</span> Departing from
                  <span style={{ fontSize: 11, fontWeight: 400, color: "var(--tb-light)" }}>(optional)</span>
                </label>
                <div style={{
                  borderRadius: 16, overflow: "hidden", background: "#fff",
                  border: `2px solid ${departingCity ? "var(--tb-teal, #00A8A8)" : "rgba(0,0,0,0.06)"}`,
                  boxShadow: departingCity ? "0 0 0 4px rgba(0,168,168,0.06)" : "0 1px 4px rgba(0,0,0,0.03)",
                  transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                }}>
                  <select
                    value={departingCity}
                    onChange={(e) => setDepartingCity(e.target.value)}
                    style={{
                      width: "100%", padding: "14px 18px", fontSize: 15,
                      fontWeight: 500, color: departingCity ? "var(--tb-text)" : "var(--tb-light)",
                      border: "none", outline: "none", background: "transparent",
                      cursor: "pointer", fontFamily: "inherit",
                      WebkitAppearance: "none", appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                    }}
                  >
                    <option value="">Select your city</option>
                    {["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Kochi", "Chandigarh", "Guwahati", "Indore", "Coimbatore"].map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                {departingCity && (
                  <div className="animate-fadeIn" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="#00A8A8">
                      <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.41 5.29a.75.75 0 00-1.06-1.06L7 7.59 5.65 6.24a.75.75 0 10-1.06 1.06l1.88 1.88a.75.75 0 001.06 0l3.88-3.89z"/>
                    </svg>
                    <span style={{ fontSize: 12, color: "#00A8A8", fontWeight: 500 }}>Travel options from {departingCity}</span>
                  </div>
                )}
              </div>

              {/* Trust signal */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 16px", borderRadius: 12,
                background: "#FAFAF8", border: "1px solid rgba(0,0,0,0.03)",
              }}>
                <span style={{ fontSize: 13 }}>🔒</span>
                <span style={{ fontSize: 12.5, color: "var(--tb-muted)", fontWeight: 500 }}>
                  Only you can edit. Friends just vote.
                </span>
              </div>

              {/* CTA — keep orange per user request */}
              <button
                onClick={handleCreate}
                disabled={loading || !tripName.trim() || !dateRange?.from || !dateRange?.to}
                className="w-full flex items-center justify-center gap-2.5 text-white font-bold text-[16px] rounded-[18px] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                style={{
                  padding: "17px 24px",
                  background: "linear-gradient(135deg, var(--tb-orange) 0%, var(--tb-orange-light) 100%)",
                  boxShadow: "0 4px 16px rgba(255,107,53,0.3)",
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      display: "inline-block", width: 18, height: 18,
                      border: "2.5px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff", borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    Creating...
                  </>
                ) : (
                  <>
                    Create Trip →
                  </>
                )}
              </button>

              {/* Footer trust */}
              <p className="text-center text-[12px]" style={{ color: "var(--tb-light)", marginTop: -8 }}>
                No app download needed · Share via WhatsApp · ₹0 to plan
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: "relative",
                background: "linear-gradient(145deg, #ffffff 0%, #FEFCF9 100%)",
                borderRadius: 24,
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 12px 48px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.03)",
                padding: "36px 28px",
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 20, textAlign: "center",
                overflow: "hidden",
              }}
            >
              <ConfettiParticles />

              {/* Celebration emoji */}
              <div className="animate-bounceIn" style={{ position: "relative", zIndex: 1, fontSize: 56, lineHeight: 1 }}>🎉</div>

              <div style={{ position: "relative", zIndex: 1, animation: "slideUp 0.5s ease-out 0.2s both" }}>
                <h2 className="font-playfair" style={{ fontSize: 28, fontWeight: 800, color: "var(--tb-text)", marginBottom: 6 }}>Trip created!</h2>
                <p style={{ fontSize: 14, color: "var(--tb-muted)", lineHeight: 1.5, maxWidth: 280 }}>
                  Share this link with your group. They'll vote on dates and budget.
                </p>
              </div>

              {/* Copy link */}
              <div
                onClick={copyLink}
                style={{
                  position: "relative", zIndex: 1,
                  width: "100%", padding: "14px 16px", borderRadius: 14,
                  background: copied ? "rgba(37,211,102,0.08)" : "rgba(255,107,53,0.04)",
                  border: `1.5px solid ${copied ? "rgba(37,211,102,0.2)" : "rgba(255,107,53,0.12)"}`,
                  display: "flex", alignItems: "center", gap: 10,
                  cursor: "pointer", transition: "all 0.3s ease",
                  animation: "slideUp 0.5s ease-out 0.3s both",
                }}
              >
                <span style={{ fontSize: 16 }}>🔗</span>
                <span style={{ flex: 1, fontSize: 13, color: "var(--tb-text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
                  {shareUrl}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: copied ? "#25D366" : "var(--tb-orange)",
                  padding: "4px 10px", borderRadius: 8,
                  background: copied ? "rgba(37,211,102,0.1)" : "rgba(255,107,53,0.08)",
                  transition: "all 0.2s ease", flexShrink: 0,
                }}>
                  {copied ? "✓ Copied!" : "Copy"}
                </span>
              </div>

              {/* WhatsApp share — green */}
              <button
                onClick={handleWhatsAppShare}
                style={{
                  position: "relative", zIndex: 1,
                  width: "100%", padding: "17px 24px", borderRadius: 18, border: "none",
                  background: "linear-gradient(135deg, #25D366 0%, #2EE07A 100%)",
                  color: "#fff", fontSize: 17, fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(37,211,102,0.25)",
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  animation: "slideUp 0.5s ease-out 0.4s both",
                }}
                className="hover:-translate-y-0.5"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share on WhatsApp
              </button>

              {/* View trip */}
              <button
                onClick={() => router.push(`/t/${created}`)}
                style={{
                  position: "relative", zIndex: 1,
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: 600, color: "var(--tb-orange)",
                  padding: "8px 16px", borderRadius: 10,
                  transition: "all 0.2s ease",
                  animation: "slideUp 0.5s ease-out 0.5s both",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                View trip →
              </button>

              {/* What happens next */}
              <div style={{
                position: "relative", zIndex: 1,
                width: "100%", padding: "14px 16px", borderRadius: 14,
                background: "#FAFAF8", border: "1px solid rgba(0,0,0,0.03)",
                animation: "slideUp 0.5s ease-out 0.6s both",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--tb-light)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  What happens next
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {WHAT_NEXT.map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>{step.icon}</span>
                      <span style={{ fontSize: 12.5, color: "var(--tb-muted)" }}>{step.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
