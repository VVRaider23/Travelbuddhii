"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { AddExpenseDrawer } from "@/components/expenses/AddExpenseDrawer";
import { SettlementList } from "@/components/expenses/SettlementList";
import { MemberRoster } from "@/components/trip/MemberRoster";
import { StepFooter } from "@/components/layout/StepFooter";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { computeBalances, computeSettlements } from "@/lib/settlement";
import { memberDisplayName, fallbackName } from "@/lib/memberProfile";

interface ExpenseSplit {
  id: string;
  user_id: string;
  amount: number;
  is_settled: boolean;
}

interface Expense {
  id: string;
  paid_by: string;
  amount: number;
  description: string;
  category: string;
  created_at: string;
  expense_splits: ExpenseSplit[];
}

interface Member {
  user_id: string;
  role: string;
  display_name?: string | null;
  avatar_url?: string | null;
  upi_id?: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍽️",
  transport: "🚗",
  stay: "🏨",
  activity: "🎯",
  shopping: "🛍️",
  other: "📦",
};

export default function ExpensesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [tab, setTab] = useState<"expenses" | "wrapup">("expenses");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${slug}/expenses`);
      const data = await res.json();
      setExpenses(data.expenses ?? []);
      setMembers(data.members ?? []);
      setCurrentUserId(data.currentUserId ?? "");
    } catch {
      toast.error("Could not load expenses");
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const perPerson = members.length > 0 ? totalSpent / members.length : 0;

  // Compute settlements
  const splitMap = expenses.flatMap((e) =>
    e.expense_splits.map((s) => ({
      expense_id: e.id,
      user_id: s.user_id,
      amount: Number(s.amount),
      is_settled: s.is_settled,
    }))
  );

  const balances = computeBalances(
    expenses.map((e) => ({ id: e.id, paid_by: e.paid_by, amount: Number(e.amount) })),
    splitMap
  );
  const settlements = computeSettlements(balances);

  function getMemberName(userId: string): string {
    const m = members.find((m) => m.user_id === userId);
    return m ? memberDisplayName(m) : fallbackName(userId);
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--tb-cream)" }}>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-3"
        style={{ backgroundColor: "white", borderBottom: "1px solid var(--tb-sand)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--tb-text)" }}>Expenses</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--tb-muted)" }}>
              Total: ₹{totalSpent.toLocaleString("en-IN")}
              {members.length > 0 && ` · ₹${Math.round(perPerson).toLocaleString("en-IN")}/person`}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 rounded-xl p-1" style={{ backgroundColor: "var(--tb-sand)" }}>
          <button
            onClick={() => setTab("expenses")}
            className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={
              tab === "expenses"
                ? { backgroundColor: "white", color: "var(--tb-text)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                : { color: "var(--tb-muted)" }
            }
          >
            Expenses
          </button>
          <button
            onClick={() => setTab("wrapup")}
            className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={
              tab === "wrapup"
                ? { backgroundColor: "white", color: "var(--tb-text)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                : { color: "var(--tb-muted)" }
            }
          >
            Wrap-up
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {tab === "expenses" ? (
          expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">💸</div>
              <p className="font-semibold" style={{ color: "var(--tb-text)" }}>No expenses yet</p>
              <p className="text-sm mt-1" style={{ color: "var(--tb-muted)" }}>Add your first shared expense</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: "white", border: "1px solid var(--tb-sand)" }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{CATEGORY_ICONS[expense.category] ?? "📦"}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--tb-text)" }}>{expense.description}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--tb-muted)" }}>
                          paid by {getMemberName(expense.paid_by)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold" style={{ color: "var(--tb-text)" }}>
                        ₹{Number(expense.amount).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs" style={{ color: "var(--tb-light)" }}>
                        {new Date(expense.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>

                  {/* Split preview */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {expense.expense_splits.map((split) => (
                      <span
                        key={split.id}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={
                          split.is_settled
                            ? { backgroundColor: "rgba(0,168,168,0.1)", color: "var(--tb-teal-dark)" }
                            : { backgroundColor: "var(--tb-cream)", color: "var(--tb-muted)" }
                        }
                      >
                        {getMemberName(split.user_id).split(" ")[0]}: ₹{Number(split.amount).toFixed(0)}
                        {split.is_settled ? " ✓" : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col gap-4">
            {/* Names and UPI IDs live here: settlements are unusable without them */}
            <MemberRoster
              slug={slug}
              members={members}
              currentUserId={currentUserId}
              onUpdated={loadData}
            />

            {/* Summary */}
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: "white", border: "1px solid var(--tb-sand)" }}
            >
              <p className="text-sm" style={{ color: "var(--tb-muted)" }}>Total trip cost</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--tb-text)" }}>
                ₹{totalSpent.toLocaleString("en-IN")}
              </p>
              {members.length > 0 && (
                <p className="text-sm mt-0.5" style={{ color: "var(--tb-muted)" }}>
                  ₹{Math.round(perPerson).toLocaleString("en-IN")} per person · {members.length} people
                </p>
              )}
            </div>

            {/* Settlements */}
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: "var(--tb-text)" }}>
                {settlements.length > 0
                  ? `${settlements.length} transfer${settlements.length > 1 ? "s" : ""} to settle everything`
                  : "All settled!"}
              </p>
              <SettlementList
                settlements={settlements}
                members={members}
                currentUserId={currentUserId}
                slug={slug}
                onSettled={loadData}
              />
            </div>
          </div>
        )}
      </div>

      {/* FAB — sits above the sticky step footer */}
      <div
        className="fixed right-4 z-30"
        style={{ bottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
      >
        <AddExpenseDrawer slug={slug} members={members} onAdded={loadData} />
      </div>

      <StepFooter slug={slug} current="expenses" />
    </div>
  );
}
