"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTripStore } from "@/store/tripStore";
import { BudgetSlider } from "@/components/budget/BudgetSlider";
import { VibeChips } from "@/components/budget/VibeChips";
import { AnonymousAggregation } from "@/components/budget/AnonymousAggregation";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

interface BudgetData {
  myBudget: { budget_min: number; budget_max: number } | null;
  myVibes: string[];
  overlap: { min: number; max: number } | null;
  vibeCount: Record<string, number>;
  respondedCount: number;
  totalMembers: number;
}

export default function BudgetPage() {
  const params = useParams();
  const slug = params.slug as string;
  const currentUserId = useTripStore((s) => s.currentUserId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<BudgetData | null>(null);

  const [budgetMin, setBudgetMin] = useState(15000);
  const [budgetMax, setBudgetMax] = useState(35000);
  const [vibes, setVibes] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/trips/${slug}/budget`)
      .then((r) => r.json())
      .then((d: BudgetData) => {
        setData(d);
        if (d.myBudget) {
          setBudgetMin(d.myBudget.budget_min);
          setBudgetMax(d.myBudget.budget_max);
          setSubmitted(true);
        }
        if (d.myVibes?.length > 0) {
          setVibes(d.myVibes);
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Could not load budget data");
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function handleSave() {
    if (vibes.length === 0) {
      toast.error("Select at least one vibe");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/trips/${slug}/budget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budget_min: budgetMin, budget_max: budgetMax, vibes }),
    });

    const body = await res.json();
    setSaving(false);

    if (!res.ok) {
      toast.error(body.error ?? "Could not save. Try again.");
      return;
    }

    toast.success("Preferences saved!");
    setSubmitted(true);

    // Refresh data to get updated overlap
    const fresh = await fetch(`/api/trips/${slug}/budget`).then((r) => r.json());
    setData(fresh);
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-0 pb-6">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Budget + Vibe</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Your budget stays private — only the overlap is shown
        </p>
        {/* Privacy badge */}
        <div className="mt-3 flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
          <span className="text-sm">🔒</span>
          <span className="text-xs text-green-700">
            Individual budgets are never shared. We only show where everyone overlaps.
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-4">
        {/* Budget slider */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-sm font-semibold text-gray-800 mb-4">Your comfort budget (per person)</p>
          <BudgetSlider
            min={budgetMin}
            max={budgetMax}
            onChange={(min, max) => { setBudgetMin(min); setBudgetMax(max); }}
          />
        </div>

        {/* Vibe chips */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-sm font-semibold text-gray-800 mb-1">What kind of trip?</p>
          <p className="text-xs text-gray-400 mb-4">Pick all that apply</p>
          <VibeChips selected={vibes} onChange={setVibes} />
        </div>

        {/* Save button */}
        <motion.button
          onClick={handleSave}
          disabled={saving || vibes.length === 0}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl text-white font-semibold text-base disabled:opacity-50 transition-all"
          style={{ backgroundColor: "#25D366" }}
        >
          {saving ? "Saving..." : submitted ? "Update preferences" : "Save preferences"}
        </motion.button>

        {/* Group results */}
        {data && (data.respondedCount >= 1 || submitted) && (
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Group summary
            </p>
            <AnonymousAggregation
              overlap={data.overlap}
              respondedCount={data.respondedCount}
              totalMembers={data.totalMembers}
              vibeCount={data.vibeCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
