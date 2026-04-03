"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_STATES = [
  {
    id: "dates",
    label: "Dates",
    content: <DatesDemo />,
  },
  {
    id: "budget",
    label: "Budget",
    content: <BudgetDemo />,
  },
  {
    id: "destinations",
    label: "Destination",
    content: <DestinationsDemo />,
  },
  {
    id: "itinerary",
    label: "Itinerary",
    content: <ItineraryDemo />,
  },
];

export function ProductDemo() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % DEMO_STATES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full rounded-2xl bg-white border border-gray-100 shadow-lg overflow-hidden">
      {/* Tab indicators */}
      <div className="flex border-b border-gray-100">
        {DEMO_STATES.map((state, i) => (
          <button
            key={state.id}
            onClick={() => setCurrent(i)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              i === current
                ? "text-orange-500 border-b-2 border-orange-500"
                : "text-gray-400"
            }`}
          >
            {state.label}
          </button>
        ))}
      </div>

      {/* Demo content */}
      <div className="h-36 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            {DEMO_STATES[current].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function DatesDemo() {
  const dates = ["22", "23", "24", "25", "26", "27", "28"];
  const availability = [5, 6, 6, 4, 3, 5, 2];
  const max = 6;

  return (
    <div className="w-full">
      <p className="text-xs text-gray-400 mb-2 text-left">March availability</p>
      <div className="flex gap-1">
        {dates.map((d, i) => {
          const intensity = availability[i] / max;
          const bg =
            intensity >= 0.9
              ? "bg-green-500"
              : intensity >= 0.7
              ? "bg-green-400"
              : intensity >= 0.5
              ? "bg-amber-400"
              : intensity >= 0.3
              ? "bg-amber-200"
              : "bg-gray-100";
          return (
            <div key={d} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <span className="text-xs font-bold text-white drop-shadow">
                  {availability[i]}/6
                </span>
              </div>
              <span className="text-xs text-gray-400">{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BudgetDemo() {
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex justify-between text-xs text-gray-400">
        <span>₹10K</span>
        <span className="font-medium text-gray-700">Group sweet spot: ₹22K–₹35K</span>
        <span>₹1L</span>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full">
        <div className="absolute h-full rounded-full bg-green-400" style={{ left: "20%", width: "30%" }} />
        <div className="absolute w-4 h-4 rounded-full bg-white border-2 border-green-500 shadow top-1/2 -translate-y-1/2" style={{ left: "19%" }} />
        <div className="absolute w-4 h-4 rounded-full bg-white border-2 border-green-500 shadow top-1/2 -translate-y-1/2" style={{ left: "49%" }} />
      </div>
      <p className="text-xs text-center text-gray-500">4 of 6 people comfortable here · Mid-range hotel trip</p>
    </div>
  );
}

function DestinationsDemo() {
  const destinations = [
    { name: "Goa", emoji: "🏖️", fit: "5/6 budgets" },
    { name: "Pondicherry", emoji: "🏛️", fit: "6/6 budgets" },
    { name: "Coorg", emoji: "🌿", fit: "4/6 budgets" },
  ];

  return (
    <div className="flex gap-2 w-full">
      {destinations.map((d, i) => (
        <motion.div
          key={d.name}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex-1 rounded-xl border border-gray-100 bg-gray-50 p-2 text-center"
        >
          <div className="text-2xl">{d.emoji}</div>
          <div className="text-xs font-medium text-gray-800 mt-1">{d.name}</div>
          <div className="text-xs text-green-600">{d.fit}</div>
        </motion.div>
      ))}
    </div>
  );
}

function ItineraryDemo() {
  const items = [
    { time: "9 AM", place: "Calangute Beach", day: 1 },
    { time: "1 PM", place: "Britto's Restaurant", day: 1 },
    { time: "3 PM", place: "Chapora Fort", day: 1 },
  ];
  const colors = ["bg-blue-400", "bg-blue-400", "bg-blue-400"];

  return (
    <div className="w-full flex flex-col gap-1.5">
      {items.map((item, i) => (
        <motion.div
          key={item.place}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
          className="flex items-center gap-2"
        >
          <span className="text-xs text-gray-400 w-10 shrink-0">{item.time}</span>
          <div className={`w-2 h-2 rounded-full shrink-0 ${colors[i]}`} />
          <span className="text-xs text-gray-700 font-medium">{item.place}</span>
        </motion.div>
      ))}
      <div className="text-xs text-orange-500 mt-1">✨ AI-generated in 12 seconds</div>
    </div>
  );
}
