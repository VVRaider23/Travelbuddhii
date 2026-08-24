"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { memberDisplayName } from "@/lib/memberProfile";

const CATEGORIES = [
  { id: "food", label: "Food", emoji: "🍽️" },
  { id: "transport", label: "Transport", emoji: "🚗" },
  { id: "stay", label: "Stay", emoji: "🏨" },
  { id: "activity", label: "Activity", emoji: "🎯" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "other", label: "Other", emoji: "📦" },
];

interface Member {
  user_id: string;
  role: string;
  display_name?: string | null;
}

interface Props {
  slug: string;
  members: Member[];
  onAdded: () => void;
}

export function AddExpenseDrawer({ slug, members, onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(members.map((m) => m.user_id))
  );
  const [saving, setSaving] = useState(false);

  function resetAndClose() {
    setOpen(false);
    setTimeout(() => {
      setStep(1);
      setAmount("");
      setDescription("");
      setCategory("other");
      setSelectedMembers(new Set(members.map((m) => m.user_id)));
    }, 300);
  }

  async function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!description.trim()) {
      toast.error("Add a description");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/trips/${slug}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amt,
        description: description.trim(),
        category,
        split_with: Array.from(selectedMembers),
      }),
    });

    setSaving(false);
    if (!res.ok) {
      toast.error("Could not add expense. Try again.");
      return;
    }

    toast.success("Expense added!");
    onAdded();
    resetAndClose();
  }

  function handleNumberInput(digit: string) {
    if (digit === "." && amount.includes(".")) return;
    if (digit === "." && amount === "") {
      setAmount("0.");
      return;
    }
    // Max 2 decimal places
    const parts = amount.split(".");
    if (parts[1] && parts[1].length >= 2) return;
    setAmount((prev) => (prev === "0" && digit !== "." ? digit : prev + digit));
  }

  function handleDelete() {
    setAmount((prev) => prev.slice(0, -1));
  }

  const NUMPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl shadow-lg"
        style={{ background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-dark))" }}
      >
        +
      </motion.button>

      <Drawer.Root open={open} onOpenChange={(v) => !v && resetAndClose()} modal={true} snapPoints={[1]}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content
            className="flex flex-col fixed bottom-0 left-0 right-0 max-h-[96%] rounded-t-3xl z-50"
            style={{ backgroundColor: "white" }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--tb-sand)" }} />
            </div>

            <Drawer.Title
              className="text-center text-sm font-semibold pb-2 shrink-0"
              style={{ color: "var(--tb-text)" }}
            >
              Add expense
            </Drawer.Title>

            {step === 1 ? (
              /* Step 1: Amount numpad */
              <div className="flex flex-col flex-1">
                <div className="flex-1 flex flex-col items-center justify-center px-4 pb-2">
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-3xl" style={{ color: "var(--tb-light)" }}>₹</span>
                    <span
                      className="text-5xl font-bold tabular-nums min-w-[120px] text-center"
                      style={{ color: "var(--tb-text)" }}
                    >
                      {amount || "0"}
                    </span>
                  </div>

                  {/* Numpad */}
                  <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                    {NUMPAD.map((key) => (
                      <button
                        key={key}
                        onClick={() => key === "⌫" ? handleDelete() : handleNumberInput(key)}
                        className="h-14 rounded-2xl text-xl font-medium transition-colors active:opacity-70"
                        style={{ backgroundColor: "var(--tb-cream)", color: "var(--tb-text)" }}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-4 pb-6 shrink-0">
                  <button
                    onClick={() => amount && parseFloat(amount) > 0 && setStep(2)}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="w-full py-4 rounded-2xl text-white font-semibold text-base disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-dark))" }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Description + split */
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 pb-2">
                  {/* Amount display */}
                  <div className="text-center mb-4">
                    <span className="text-2xl font-bold" style={{ color: "var(--tb-text)" }}>₹{parseFloat(amount).toLocaleString("en-IN")}</span>
                  </div>

                  {/* Description */}
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What was this for? e.g. Lunch at Britto's"
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none mb-4"
                    style={{
                      border: "1px solid var(--tb-sand)",
                      color: "var(--tb-text)",
                      backgroundColor: "white",
                    }}
                    onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px var(--tb-teal-light)")}
                    onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                  />

                  {/* Category */}
                  <p
                    className="text-xs font-medium uppercase tracking-wide mb-2"
                    style={{ color: "var(--tb-muted)" }}
                  >Category</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className="flex items-center gap-1.5 px-3 h-9 rounded-full text-sm transition-colors"
                        style={
                          category === cat.id
                            ? { background: "linear-gradient(135deg, var(--tb-teal), var(--tb-teal-dark))", color: "white" }
                            : { backgroundColor: "var(--tb-cream)", color: "var(--tb-muted)", border: "1px solid var(--tb-sand)" }
                        }
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Split with */}
                  <p
                    className="text-xs font-medium uppercase tracking-wide mb-2"
                    style={{ color: "var(--tb-muted)" }}
                  >Split with</p>
                  <div className="flex flex-col gap-2">
                    {members.map((m) => (
                      <button
                        key={m.user_id}
                        onClick={() => {
                          setSelectedMembers((prev) => {
                            const next = new Set(prev);
                            if (next.has(m.user_id)) next.delete(m.user_id);
                            else next.add(m.user_id);
                            return next;
                          });
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                        style={
                          selectedMembers.has(m.user_id)
                            ? { border: "1px solid var(--tb-teal-light)", backgroundColor: "rgba(0,168,168,0.06)" }
                            : { border: "1px solid var(--tb-sand)", backgroundColor: "white" }
                        }
                      >
                        <div
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                          style={
                            selectedMembers.has(m.user_id)
                              ? { borderColor: "var(--tb-teal)", backgroundColor: "var(--tb-teal)" }
                              : { borderColor: "var(--tb-light)", backgroundColor: "transparent" }
                          }
                        >
                          {selectedMembers.has(m.user_id) && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                        <span className="text-sm" style={{ color: "var(--tb-text)" }}>
                          {memberDisplayName(m)}
                        </span>
                        {selectedMembers.size > 0 && (
                          <span className="text-xs ml-auto" style={{ color: "var(--tb-muted)" }}>
                            ₹{(parseFloat(amount) / selectedMembers.size).toFixed(0)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-4 pb-6 shrink-0 flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="py-3 px-5 rounded-2xl text-sm"
                    style={{ border: "1px solid var(--tb-sand)", color: "var(--tb-muted)" }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving || selectedMembers.size === 0 || !description.trim()}
                    className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-dark))" }}
                  >
                    {saving ? "Adding..." : "Add expense"}
                  </button>
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
