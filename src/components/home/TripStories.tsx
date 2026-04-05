"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

const TRIP_STORIES = [
  {
    destination: "Goa",
    emoji: "🏖️",
    groupSize: 8,
    highlight: "Saved ₹14K on hotels",
    color: "#FF6B35",
    bgGradient: "linear-gradient(135deg, #FFF1EB 0%, #FFE0D0 100%)",
    reactions: [
      { name: "Rahul", text: "Bro this app is insane 🤯", color: "#1FA855" },
      { name: "Meera", text: "Why didn't we find this earlier 😭", color: "#D4436A" },
    ],
    stats: [
      { label: "Planned in", value: "23 min" },
      { label: "Saved", value: "₹14K" },
    ],
  },
  {
    destination: "Manali",
    emoji: "⛰️",
    groupSize: 5,
    highlight: "Zero fights about dates",
    color: "#00A8A8",
    bgGradient: "linear-gradient(135deg, #E8FAF6 0%, #D0F0EA 100%)",
    reactions: [
      { name: "Priya", text: "Finally no one fought about budget 😂", color: "#6B72E0" },
      { name: "Vikram", text: "The AI itinerary was 🔥🔥🔥", color: "#D4832A" },
    ],
    stats: [
      { label: "Planned in", value: "18 min" },
      { label: "Friends", value: "5" },
    ],
  },
  {
    destination: "Pondicherry",
    emoji: "🏛️",
    groupSize: 6,
    highlight: "AI itinerary in 12 sec",
    color: "#8B5CF6",
    bgGradient: "linear-gradient(135deg, #F3F0FF 0%, #E8E0FF 100%)",
    reactions: [
      { name: "Arjun", text: "The AI itinerary was better than ours 🫡", color: "#1FA855" },
      { name: "Kavya", text: "Expense splitting saved friendships 🙏", color: "#D4436A" },
    ],
    stats: [
      { label: "Planned in", value: "12 min" },
      { label: "AI magic", value: "12 sec" },
    ],
  },
  {
    destination: "Udaipur",
    emoji: "🏰",
    groupSize: 4,
    highlight: "Perfect budget match",
    color: "#EC4899",
    bgGradient: "linear-gradient(135deg, #FFF0F7 0%, #FFE0ED 100%)",
    reactions: [
      { name: "Sneha", text: "UPI settlement is chef's kiss 💋", color: "#6B72E0" },
      { name: "Rohan", text: "10/10 would plan again 😎", color: "#D4832A" },
    ],
    stats: [
      { label: "Planned in", value: "15 min" },
      { label: "Group", value: "4 BFFs" },
    ],
  },
];

type Story = typeof TRIP_STORIES[number];

function StoryCard({ story }: { story: Story }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      className="shrink-0 overflow-hidden"
      style={{
        width: 280,
        borderRadius: 22,
        background: story.bgGradient,
        border: `1px solid ${story.color}18`,
        scrollSnapAlign: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: "18px 20px 14px" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center text-2xl"
            style={{ width: 44, height: 44, borderRadius: 14, background: `${story.color}15` }}
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
          className="flex items-center gap-1 text-[10px] font-semibold"
          style={{ padding: "3px 8px", borderRadius: 100, background: `${story.color}10`, color: story.color }}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill={story.color}>
            <path d="M8 0L9.8 2.4L12.7 1.6L12.8 4.6L15.6 5.8L14 8.4L15.6 10.2L12.8 11.4L12.7 14.4L9.8 13.6L8 16L6.2 13.6L3.3 14.4L3.2 11.4L0.4 10.2L2 8.4L0.4 5.8L3.2 4.6L3.3 1.6L6.2 2.4L8 0Z" />
          </svg>
          Verified
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex gap-2" style={{ padding: "0 20px 14px" }}>
        {story.stats.map((stat) => (
          <div
            key={stat.label}
            className="flex-1 text-center"
            style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.7)" }}
          >
            <div
              className="text-[10px] font-medium uppercase mb-0.5"
              style={{ color: "var(--tb-light)", letterSpacing: "0.05em" }}
            >
              {stat.label}
            </div>
            <div className="text-[16px] font-bold" style={{ color: "var(--tb-text)" }}>
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
          padding: "8px 12px",
          borderRadius: 10,
          background: `${story.color}10`,
          border: `1px solid ${story.color}15`,
        }}
      >
        <span className="text-[13px]">✨</span>
        <span className="text-[12.5px] font-semibold" style={{ color: story.color }}>
          {story.highlight}
        </span>
      </div>

      {/* Chat-style reactions */}
      <div className="flex flex-col gap-1.5" style={{ padding: "0 12px 16px" }}>
        {story.reactions.map((r) => (
          <div key={r.name} className="flex gap-2 items-start">
            <div
              className="shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: `${r.color}20`,
                color: r.color,
              }}
            >
              {r.name.charAt(0)}
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.8)",
                borderRadius: "2px 12px 12px 12px",
                padding: "6px 10px",
                maxWidth: "85%",
              }}
            >
              <div className="text-[10.5px] font-semibold mb-0.5" style={{ color: r.color }}>
                {r.name}
              </div>
              <div className="text-[12.5px] leading-snug" style={{ color: "var(--tb-text)" }}>
                {r.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function TripStories() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    checkScroll();
    return () => el.removeEventListener("scroll", checkScroll);
  }, []);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section className="overflow-hidden" style={{ padding: "64px 0", background: "#fff" }}>
      {/* Heading */}
      <div className="text-center px-5" style={{ maxWidth: 480, margin: "0 auto 32px" }}>
        <h2
          className="font-playfair leading-tight mb-1.5"
          style={{ fontSize: "clamp(26px,7vw,30px)", fontWeight: 800, color: "var(--tb-text)" }}
        >
          Real trips, real{" "}
          <span style={{ color: "var(--tb-orange)" }}>reactions</span>
        </h2>
        <p className="text-[15px]" style={{ color: "var(--tb-muted)" }}>
          Here&apos;s what groups are saying after using Travelbuddhii
        </p>
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Left fade + arrow */}
        {canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-0 z-10 flex items-center pl-2"
            style={{ width: 60, background: "linear-gradient(to right, white, transparent)" }}
          >
            <button
              onClick={() => scroll(-1)}
              className="flex items-center justify-center text-sm"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                color: "var(--tb-muted)",
              }}
            >
              ←
            </button>
          </div>
        )}
        {/* Right fade + arrow */}
        {canScrollRight && (
          <div
            className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-end pr-2"
            style={{ width: 60, background: "linear-gradient(to left, white, transparent)" }}
          >
            <button
              onClick={() => scroll(1)}
              className="flex items-center justify-center text-sm"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                color: "var(--tb-muted)",
              }}
            >
              →
            </button>
          </div>
        )}

        {/* Cards strip */}
        <div
          ref={scrollRef}
          className="flex gap-4"
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            padding: "8px 20px 20px",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {TRIP_STORIES.map((story) => (
            <StoryCard key={story.destination} story={story} />
          ))}
        </div>
      </div>
    </section>
  );
}
