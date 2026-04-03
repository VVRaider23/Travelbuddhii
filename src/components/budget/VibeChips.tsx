"use client";

import { motion } from "framer-motion";

export const VIBES = [
  { id: "beach", label: "Beach", emoji: "🏖️" },
  { id: "mountains", label: "Mountains", emoji: "⛰️" },
  { id: "nightlife", label: "Nightlife", emoji: "🎉" },
  { id: "culture", label: "Culture", emoji: "🏛️" },
  { id: "adventure", label: "Adventure", emoji: "🧗" },
  { id: "chill", label: "Chill", emoji: "😴" },
  { id: "food", label: "Food", emoji: "🍜" },
  { id: "nature", label: "Nature", emoji: "🌿" },
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
            className={`
              flex items-center gap-1.5 px-4 h-10 rounded-full text-sm font-medium transition-colors
              ${isSelected
                ? "bg-orange-500 text-white"
                : "bg-orange-50 text-orange-700 border border-orange-100"
              }
            `}
          >
            <span>{vibe.emoji}</span>
            <span>{vibe.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
