"use client";

import { useRef, useState, useEffect } from "react";

const TRIP_STORIES = [
  {
    destination: "Goa",
    emoji: "🏖️",
    groupSize: 8,
    highlight: "Saved ₹14K on hotels",
    color: "#FF6B35",
    cardBg: "linear-gradient(160deg, #FFF4EE 0%, #FFE8D8 100%)",
    statsBg: "rgba(255,255,255,0.85)",
    highlightBg: "rgba(255,107,53,0.08)",
    reactions: [
      { name: "Rahul", initial: "R", text: "Bro this app is insane 🤯", color: "#1FA855", avatarBg: "rgba(31,168,85,0.12)" },
      { name: "Meera", initial: "M", text: "Why didn't we find this earlier 😭", color: "#D4436A", avatarBg: "rgba(212,67,106,0.12)" },
    ],
    stats: [
      { label: "PLANNED IN", value: "23 min" },
      { label: "SAVED", value: "₹14K" },
    ],
  },
  {
    destination: "Manali",
    emoji: "⛰️",
    groupSize: 5,
    highlight: "Zero fights about dates",
    color: "#00A8A8",
    cardBg: "linear-gradient(160deg, #EDFAF7 0%, #D4F0EA 100%)",
    statsBg: "rgba(255,255,255,0.85)",
    highlightBg: "rgba(0,168,168,0.08)",
    reactions: [
      { name: "Priya", initial: "P", text: "Finally no one fought about budget 😂", color: "#6B72E0", avatarBg: "rgba(107,114,224,0.12)" },
      { name: "Vikram", initial: "V", text: "The AI itinerary was 🔥🔥🔥", color: "#D4832A", avatarBg: "rgba(212,131,42,0.12)" },
    ],
    stats: [
      { label: "PLANNED IN", value: "18 min" },
      { label: "FRIENDS", value: "5" },
    ],
  },
  {
    destination: "Pondicherry",
    emoji: "🏛️",
    groupSize: 6,
    highlight: "AI itinerary in 12 sec",
    color: "#8B5CF6",
    cardBg: "linear-gradient(160deg, #F5F0FF 0%, #EBE0FF 100%)",
    statsBg: "rgba(255,255,255,0.85)",
    highlightBg: "rgba(139,92,246,0.08)",
    reactions: [
      { name: "Arjun", initial: "A", text: "The AI itinerary was better than ours 🫡", color: "#1FA855", avatarBg: "rgba(31,168,85,0.12)" },
      { name: "Kavya", initial: "K", text: "Expense splitting saved friendships 🙏", color: "#D4436A", avatarBg: "rgba(212,67,106,0.12)" },
    ],
    stats: [
      { label: "PLANNED IN", value: "12 min" },
      { label: "AI MAGIC", value: "12 sec" },
    ],
  },
  {
    destination: "Udaipur",
    emoji: "🏰",
    groupSize: 4,
    highlight: "Perfect budget match",
    color: "#EC4899",
    cardBg: "linear-gradient(160deg, #FFF0F8 0%, #FFE0EE 100%)",
    statsBg: "rgba(255,255,255,0.85)",
    highlightBg: "rgba(236,72,153,0.08)",
    reactions: [
      { name: "Sneha", initial: "S", text: "UPI settlement is chef's kiss 💋", color: "#6B72E0", avatarBg: "rgba(107,114,224,0.12)" },
      { name: "Rohan", initial: "R", text: "10/10 would plan again 😎", color: "#D4832A", avatarBg: "rgba(212,131,42,0.12)" },
    ],
    stats: [
      { label: "PLANNED IN", value: "15 min" },
      { label: "GROUP", value: "4 BFFs" },
    ],
  },
];

export function TripStories() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Track active card via scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardWidth = 300 + 16; // card width + gap
      const idx = Math.round(el.scrollLeft / cardWidth);
      setActiveIdx(Math.min(idx, TRIP_STORIES.length - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const next = Math.max(0, Math.min(TRIP_STORIES.length - 1, activeIdx + dir));
    el.scrollTo({ left: next * (300 + 16), behavior: "smooth" });
  };

  return (
    <section
      style={{
        padding: "60px 0 64px",
        background: "linear-gradient(180deg, var(--tb-cream) 0%, #FFF5E8 100%)",
        overflow: "hidden",
      }}
    >
      {/* Badge */}
      <div className="flex justify-center mb-6">
        <span
          className="inline-flex items-center gap-1.5 text-[12px] font-medium px-4 py-1.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(0,0,0,0.06)",
            color: "var(--tb-muted)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          🇮🇳 Made for Indian friend groups
        </span>
      </div>

      {/* Heading */}
      <div className="text-center px-5 mb-8">
        <h2
          className="font-playfair leading-tight mb-2"
          style={{ fontSize: "clamp(28px,7vw,34px)", fontWeight: 800, color: "var(--tb-text)" }}
        >
          Real trips, real{" "}
          <span style={{ color: "var(--tb-orange)" }}>reactions</span>
        </h2>
        <p className="text-[14px]" style={{ color: "var(--tb-muted)" }}>
          Here&apos;s what groups are saying after using Travelbuddhii
        </p>
      </div>

      {/* Carousel */}
      <div className="relative flex items-center">
        {/* Left arrow */}
        <button
          onClick={() => scroll(-1)}
          disabled={activeIdx === 0}
          className="absolute z-10 flex items-center justify-center transition-all disabled:opacity-30"
          style={{
            left: 8,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            color: "var(--tb-muted)",
            fontSize: 16,
          }}
        >
          ←
        </button>

        {/* Cards strip */}
        <div
          ref={scrollRef}
          className="flex"
          style={{
            gap: 16,
            overflowX: "auto",
            overflowY: "hidden",
            // Center the active card with side peeks
            padding: "12px calc(50vw - 150px) 20px",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {TRIP_STORIES.map((story, i) => {
            const isActive = i === activeIdx;
            return (
              <div
                key={story.destination}
                style={{
                  flexShrink: 0,
                  width: 300,
                  borderRadius: 24,
                  background: story.cardBg,
                  border: `1px solid ${story.color}20`,
                  overflow: "hidden",
                  scrollSnapAlign: "center",
                  transform: isActive ? "scale(1)" : "scale(0.92)",
                  opacity: isActive ? 1 : 0.65,
                  transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease",
                  boxShadow: isActive
                    ? `0 12px 40px ${story.color}18, 0 4px 16px rgba(0,0,0,0.06)`
                    : "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between" style={{ padding: "20px 20px 14px" }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center text-[22px]"
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 13,
                        background: `${story.color}14`,
                      }}
                    >
                      {story.emoji}
                    </div>
                    <div>
                      <div className="text-[16px] font-bold" style={{ color: "var(--tb-text)" }}>
                        {story.destination} Trip
                      </div>
                      <div className="text-[12px]" style={{ color: "var(--tb-light)" }}>
                        {story.groupSize} friends
                      </div>
                    </div>
                  </div>
                  {/* Verified badge */}
                  <div
                    className="flex items-center gap-1 text-[11px] font-semibold"
                    style={{
                      padding: "4px 10px",
                      borderRadius: 100,
                      background: `${story.color}12`,
                      color: story.color,
                    }}
                  >
                    <svg width="9" height="9" viewBox="0 0 16 16" fill={story.color}>
                      <path d="M8 0L9.8 2.4L12.7 1.6L12.8 4.6L15.6 5.8L14 8.4L15.6 10.2L12.8 11.4L12.7 14.4L9.8 13.6L8 16L6.2 13.6L3.3 14.4L3.2 11.4L0.4 10.2L2 8.4L0.4 5.8L3.2 4.6L3.3 1.6L6.2 2.4L8 0Z" />
                    </svg>
                    Verified
                  </div>
                </div>

                {/* Stat pills */}
                <div className="flex gap-2.5" style={{ padding: "0 20px 14px" }}>
                  {story.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex-1 text-center"
                      style={{ padding: "10px 8px", borderRadius: 14, background: story.statsBg }}
                    >
                      <div
                        className="text-[9px] font-semibold mb-1"
                        style={{ color: "var(--tb-light)", letterSpacing: "0.06em" }}
                      >
                        {stat.label}
                      </div>
                      <div className="text-[18px] font-bold" style={{ color: "var(--tb-text)" }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Highlight bar */}
                <div
                  className="flex items-center gap-1.5"
                  style={{
                    margin: "0 20px 14px",
                    padding: "9px 14px",
                    borderRadius: 12,
                    background: story.highlightBg,
                    border: `1px solid ${story.color}15`,
                  }}
                >
                  <span style={{ fontSize: 13 }}>✨</span>
                  <span className="text-[13px] font-semibold" style={{ color: story.color }}>
                    {story.highlight}
                  </span>
                </div>

                {/* Reaction messages */}
                <div className="flex flex-col gap-2" style={{ padding: "0 14px 18px" }}>
                  {story.reactions.map((r) => (
                    <div
                      key={r.name}
                      className="flex items-start gap-2.5"
                      style={{
                        background: "rgba(255,255,255,0.85)",
                        borderRadius: 14,
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        className="flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: r.avatarBg,
                          color: r.color,
                          marginTop: 1,
                        }}
                      >
                        {r.initial}
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold mb-0.5" style={{ color: r.color }}>
                          {r.name}
                        </div>
                        <div className="text-[13px] leading-snug" style={{ color: "var(--tb-text)" }}>
                          {r.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll(1)}
          disabled={activeIdx === TRIP_STORIES.length - 1}
          className="absolute z-10 flex items-center justify-center transition-all disabled:opacity-30"
          style={{
            right: 8,
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            color: "var(--tb-muted)",
            fontSize: 16,
          }}
        >
          →
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-4">
        {TRIP_STORIES.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollRef.current?.scrollTo({ left: i * (300 + 16), behavior: "smooth" })}
            style={{
              width: i === activeIdx ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === activeIdx ? "var(--tb-orange)" : "rgba(0,0,0,0.12)",
              transition: "all 0.3s ease",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>
    </section>
  );
}
