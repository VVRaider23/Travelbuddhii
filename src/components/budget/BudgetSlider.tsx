"use client";

import { useState } from "react";

const MIN = 5000;
const MAX = 200000;
const STEP = 5000;

const MARKERS = [
  { value: 15000, label: "Budget hostel" },
  { value: 30000, label: "Mid-range hotel" },
  { value: 60000, label: "Premium resort" },
];

interface Props {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

function formatINR(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

export function BudgetSlider({ min, max, onChange }: Props) {
  const range = MAX - MIN;

  function minPct() { return ((min - MIN) / range) * 100; }
  function maxPct() { return ((max - MIN) / range) * 100; }

  function handleMinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.min(Number(e.target.value), max - STEP);
    onChange(val, max);
  }

  function handleMaxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.max(Number(e.target.value), min + STEP);
    onChange(min, val);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Value display */}
      <div className="flex items-center justify-between">
        <div className="bg-green-50 px-3 py-1.5 rounded-xl">
          <span className="text-lg font-bold text-green-700">{formatINR(min)}</span>
        </div>
        <span className="text-gray-300 text-sm">–</span>
        <div className="bg-green-50 px-3 py-1.5 rounded-xl">
          <span className="text-lg font-bold text-green-700">{formatINR(max)}</span>
        </div>
      </div>

      {/* Dual range slider */}
      <div className="relative pt-1 pb-8">
        {/* Track */}
        <div className="relative h-2 rounded-full bg-gray-200">
          {/* Filled portion */}
          <div
            className="absolute h-2 rounded-full bg-green-400"
            style={{ left: `${minPct()}%`, width: `${maxPct() - minPct()}%` }}
          />
        </div>

        {/* Min thumb */}
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={min}
          onChange={handleMinChange}
          className="absolute inset-x-0 top-0 h-2 w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
        />

        {/* Max thumb */}
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={max}
          onChange={handleMaxChange}
          className="absolute inset-x-0 top-0 h-2 w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
        />

        {/* Markers */}
        <div className="absolute inset-x-0 top-5 flex items-end">
          {MARKERS.map((m) => {
            const pct = ((m.value - MIN) / range) * 100;
            return (
              <div
                key={m.value}
                className="absolute flex flex-col items-center"
                style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
              >
                <div className="w-px h-2 bg-gray-300" />
                <span className="text-[9px] text-gray-400 text-center mt-0.5 whitespace-nowrap">
                  {formatINR(m.value)}
                  <br />{m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
