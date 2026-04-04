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
      <div
        className="px-4 pt-6 pb-4"
        style={{ background: "rgba(255,255,255,0.9)", borderBottom: "1px solid rgba(0,0,0,0.04)" }}
      >
        <h1 className="text-[20px] font-bold" style={{ color: "var(--tb-text)" }}>
          Budget + Vibe 💰
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: "var(--tb-light)" }}>
          Your budget stays private — only the overlap is shown
        </p>
        <div
          className="mt-3 flex items-center gap-2 px-3 py-2 rounded-[12px]"
          style={{ background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.12)" }}
        >
          <span className="text-sm">🔒</span>
          <span className="text-[12px] font-medium" style={{ color: "#16A34A" }}>
            Individual budgets are never shared. We only show where everyone overlaps.
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4">
        {/* Budget slider */}
        <div
          className="rounded-[18px] p-5"
          style={{
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <p className="text-[14px] font-semibold mb-4" style={{ color: "var(--tb-text)" }}>
            Your comfort budget (per person)
          </p>
          <BudgetSlider
            min={budgetMin}
            max={budgetMax}
            onChange={(min, max) => { setBudgetMin(min); setBudgetMax(max); }}
          />
        </div>

        {/* Vibe chips */}
        <div
          className="rounded-[18px] p-5"
          style={{
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(0,0,0,0.04)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <p className="text-[14px] font-semibold mb-1" style={{ color: "var(--tb-text)" }}>
            What kind of trip? ✨
          </p>
          <p className="text-[12px] mb-4" style={{ color: "var(--tb-light)" }}>
            Pick all that apply
          </p>
          <VibeChips selected={vibes} onChange={setVibes} />
        </div>

        {/* Save button */}
        <motion.button
          onClick={handleSave}
          disabled={saving || vibes.length === 0}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-[18px] text-white font-bold text-[16px] disabled:opacity-50 transition-all hover:-translate-y-0.5 disabled:translate-y-0"
          style={{
            background: "linear-gradient(135deg, #25D366 0%, #2EE07A 100%)",
            boxShadow: "0 4px 16px rgba(37,211,102,0.25)",
          }}
        >
          {saving ? "Saving..." : submitted ? "Update preferences" : "Save preferences"}
        </motion.button>

        {/* Group results */}
        {data && (data.respondedCount >= 1 || submitted) && (
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-widest mb-3 pl-1"
              style={{ color: "var(--tb-light)" }}
            >
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
