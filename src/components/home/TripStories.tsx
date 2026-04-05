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
    reactions: [
      { name: "Rahul", initial: "R", text: "Bro this app is insane 🤯", color: "#1FA855" },
      { name: "Meera", initial: "M", text: "Why didn't we find this earlier 😭", color: "#D4436A" },
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
    reactions: [
      { name: "Priya", initial: "P", text: "Finally no one fought about budget 😂", color: "#6B72E0" },
      { name: "Vikram", initial: "V", text: "The AI itinerary was 🔥🔥🔥", color: "#D4832A" },
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
    reactions: [
      { name: "Arjun", initial: "A", text: "The AI itinerary was better than ours 🫡", color: "#1FA855" },
      { name: "Kavya", initial: "K", text: "Expense splitting saved friendships 🙏", color: "#D4436A" },
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
    reactions: [
      { name: "Sneha", initial: "S", text: "UPI settlement is chef's kiss 💋", color: "#6B72E0" },
      { name: "Rohan", initial: "R", text: "10/10 would plan again 😎", color: "#D4832A" },
    ],
    stats: [
      { label: "PLANNED IN", value: "15 min" },
      { label: "GROUP", value: "4 BFFs" },
    ],
  },
];

export function TripStories() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (280 + 16), behavior: "smooth" });
  };

  return (
    <section
      style={{
        padding: "64px 0 64px",
        background: "white",
        overflow: "hidden",
      }}
    >
      {/* Heading block */}
      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", padding: "0 20px", marginBottom: 32 }}>
        <h2
          className="font-playfair"
          style={{ fontSize: 30, fontWeight: 800, color: "var(--tb-text)", marginBottom: 8, lineHeight: 1.2 }}
        >
          Real trips, real reactions
        </h2>
        <p style={{ fontSize: 14, color: "var(--tb-muted)" }}>
          Here&apos;s what groups are saying after using Travelbuddhii
        </p>
      </div>

      {/* Scroll container */}
      <div style={{ position: "relative" }}>
        {/* Left fade + arrow */}
        {canScrollLeft && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 60,
              zIndex: 10,
              background: "linear-gradient(to right, white, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingLeft: 8,
            }}
          >
            <button
              onClick={() => scroll(-1)}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                color: "var(--tb-muted)",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
          </div>
        )}

        {/* Right fade + arrow */}
        {canScrollRight && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 60,
              zIndex: 10,
              background: "linear-gradient(to left, white, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 8,
            }}
          >
            <button
              onClick={() => scroll(1)}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                color: "var(--tb-muted)",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              →
            </button>
          </div>
        )}

        {/* Scroll div */}
        <div
          ref={scrollRef}
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            padding: "8px 20px 20px",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          } as React.CSSProperties}
        >
          {TRIP_STORIES.map((story) => (
            <div
              key={story.destination}
              style={{
                flexShrink: 0,
                width: 280,
                borderRadius: 22,
                background: story.cardBg,
                border: `1px solid ${story.color}20`,
                overflow: "hidden",
                scrollSnapAlign: "start",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                boxShadow: `0 4px 16px ${story.color}14, 0 2px 8px rgba(0,0,0,0.04)`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${story.color}20, 0 4px 16px rgba(0,0,0,0.06)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${story.color}14, 0 2px 8px rgba(0,0,0,0.04)`;
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: `${story.color}14`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    {story.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tb-text)" }}>
                      {story.destination} Trip
                    </div>
                    <div style={{ fontSize: 12, color: "var(--tb-light)" }}>
                      {story.groupSize} friends
                    </div>
                  </div>
                </div>
                {/* Verified badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
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

              {/* Stats pills */}
              <div style={{ display: "flex", gap: 10, padding: "0 20px 14px" }}>
                {story.stats.map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "10px 8px",
                      borderRadius: 14,
                      background: story.statsBg,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--tb-light)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--tb-text)" }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Highlight bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  margin: "0 20px 14px",
                  padding: "9px 14px",
                  borderRadius: 12,
                  background: `${story.color}10`,
                  border: `1px solid ${story.color}15`,
                }}
              >
                <span style={{ fontSize: 13 }}>✨</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: story.color }}>{story.highlight}</span>
              </div>

              {/* Reactions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 14px 18px" }}>
                {story.reactions.map((r) => (
                  <div
                    key={r.name}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: `${r.color}20`,
                        color: r.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {r.initial}
                    </div>
                    {/* Bubble */}
                    <div
                      style={{
                        background: "rgba(255,255,255,0.8)",
                        borderRadius: "2px 12px 12px 12px",
                        padding: "6px 10px",
                        flex: 1,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: r.color, marginBottom: 2 }}>{r.name}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.4, color: "var(--tb-text)" }}>{r.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
