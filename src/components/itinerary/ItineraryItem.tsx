"use client";

import { motion } from "framer-motion";

export interface ItineraryItemData {
  id: string;
  day_number: number;
  position: number;
  place_name: string;
  place_id: string | null;
  category: string;
  notes: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  isNew?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  activity: "🎯",
  meal: "🍽️",
  transport: "🚗",
  accommodation: "🏨",
};

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  activity: "var(--tb-teal)",
  meal: "var(--tb-orange)",
  transport: "var(--tb-muted)",
  accommodation: "var(--tb-teal-dark)",
};

const BOOKING_LINKS: Record<string, { label: string; color: string; url: (q: string) => string }> = {
  accommodation: {
    label: "MakeMyTrip",
    color: "bg-red-600 text-white",
    url: (q) => `https://www.makemytrip.com/hotels/?checkin=&city=${encodeURIComponent(q)}`,
  },
  transport: {
    label: "IRCTC",
    color: "bg-blue-700 text-white",
    url: (q) => `https://www.irctc.co.in/`,
  },
};

interface Props {
  item: ItineraryItemData;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onDelete?: () => void;
}

export function ItineraryItem({ item, isDragging, dragHandleProps, onDelete }: Props) {
  const icon = CATEGORY_ICONS[item.category] ?? "📍";
  const booking = BOOKING_LINKS[item.category];
  const borderColor = CATEGORY_BORDER_COLORS[item.category] ?? "var(--tb-sand)";

  return (
    <motion.div
      layout
      initial={item.isNew ? { x: 20, backgroundColor: "#f0fdf4" } : false}
      animate={{ x: 0, backgroundColor: "#ffffff" }}
      transition={{ duration: 2 }}
      className={`bg-white rounded-xl p-3 flex gap-3 items-start transition-shadow ${
        isDragging ? "shadow-lg" : ""
      }`}
      style={{
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: isDragging ? "var(--tb-orange)" : "var(--tb-sand)",
        borderLeftWidth: "3px",
        borderLeftColor: borderColor,
      }}
    >
      {/* Drag handle */}
      <div {...dragHandleProps} className="text-lg mt-0.5 cursor-grab active:cursor-grabbing select-none" style={{ color: "var(--tb-light)" }}>
        ⋮⋮
      </div>

      {/* Category icon */}
      <div className="text-lg shrink-0 mt-0.5">{icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug" style={{ color: "var(--tb-text)" }}>{item.place_name}</p>
          {item.start_time && (
            <span className="text-xs shrink-0 mt-0.5 font-medium" style={{ color: "var(--tb-teal)" }}>{item.start_time.slice(0, 5)}</span>
          )}
        </div>
        {item.notes && (
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--tb-muted)" }}>{item.notes}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {item.duration_minutes && (
            <span className="text-xs" style={{ color: "var(--tb-light)" }}>{item.duration_minutes}min</span>
          )}
          {booking && (
            <a
              href={booking.url(item.place_name)}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${booking.color}`}
            >
              {booking.label}
            </a>
          )}
          {item.category === "transport" && (
            <a
              href="https://www.redbus.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "var(--tb-orange)", color: "white" }}
            >
              RedBus
            </a>
          )}
        </div>
      </div>

      {/* Delete */}
      {onDelete && (
        <button onClick={onDelete} className="text-sm shrink-0 transition-colors" style={{ color: "var(--tb-light)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--tb-light)")}
        >
          ✕
        </button>
      )}
    </motion.div>
  );
}
