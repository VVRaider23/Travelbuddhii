"use client";

import { motion } from "framer-motion";

export const VIBES = [
  { id: "beach",     label: "Beach",     emoji: "🏖️", color: "#FF6B35" },
  { id: "mountains", label: "Mountains", emoji: "⛰️", color: "#00A8A8" },
  { id: "nightlife", label: "Nightlife", emoji: "🎉", color: "#8B5CF6" },
  { id: "culture",   label: "Culture",   emoji: "🏛️", color: "#EC4899" },
  { id: "adventure", label: "Adventure", emoji: "🧗", color: "#F59E0B" },
  { id: "chill",     label: "Chill",     emoji: "😴", color: "#10B981" },
  { id: "food",      label: "Food",      emoji: "🍜", color: "#EF4444" },
  { id: "nature",    label: "Nature",    emoji: "🌿", color: "#22C55E" },
];

interface Props {
  selected: string[];
  onChange: (vibes: string[]) => void;
}

export function VibeChips({ selected, onChange }: Props) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((v) => v !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {VIBES.map((vibe) => {
        const isSelected = selected.includes(vibe.id);
        return (
          <motion.button
            key={vibe.id}
            onClick={() => toggle(vibe.id)}
            whileTap={{ scale: 0.92 }}
            className="flex items-center gap-1.5 h-10 px-4 rounded-full text-[13px] font-medium transition-all"
            style={{
              background: isSelected ? vibe.color : `${vibe.color}0F`,
              color: isSelected ? "#fff" : vibe.color,
              border: `1.5px solid ${isSelected ? vibe.color : `${vibe.color}25`}`,
              boxShadow: isSelected ? `0 2px 8px ${vibe.color}30` : "none",
            }}
          >
            <span>{vibe.emoji}</span>
            <span>{vibe.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
