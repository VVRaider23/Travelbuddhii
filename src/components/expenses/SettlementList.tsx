"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { buildUpiRedirectUrl } from "@/lib/upi";
import type { Settlement } from "@/lib/settlement";

interface Member {
  user_id: string;
  display_name?: string;
  upi_id?: string;
}

interface Props {
  settlements: Settlement[];
  members: Member[];
  currentUserId: string;
  slug: string;
  onSettled: () => void;
}

export function SettlementList({ settlements, members, currentUserId, slug, onSettled }: Props) {
  const [settling, setSettling] = useState<Set<string>>(new Set());
  const [settled, setSettled] = useState<Set<string>>(new Set());

  function getMember(userId: string): Member {
    return members.find((m) => m.user_id === userId) ?? { user_id: userId };
  }

  function getName(userId: string): string {
    const m = getMember(userId);
    return m.display_name ?? `User ${userId.slice(0, 6)}`;
  }

  async function handlePay(settlement: Settlement) {
    const toMember = getMember(settlement.to);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin;

    const upiUrl = buildUpiRedirectUrl(baseUrl, {
      pa: toMember.upi_id ?? `${getName(settlement.to).toLowerCase().replace(" ", ".")}@upi`,
      pn: getName(settlement.to),
      am: settlement.amount,
      tn: `TripSync settlement`,
    });

    // Log event
    await fetch(`/api/events/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "settlement_link_opened",
        trip_id: slug,
        user_id: currentUserId,
      }),
    });

    window.open(upiUrl, "_blank");

    // Mark as settled client-side immediately (optimistic)
    setSettled((prev) => new Set([...prev, settlement.to]));
    toast.success("UPI app opened. Mark as settled once done.");
    onSettled();
  }

  if (settlements.length === 0) {
    return (
      <div className="bg-green-50 rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">🎉</div>
        <p className="font-semibold text-green-700">Everyone is settled up!</p>
        <p className="text-sm text-green-600 mt-1">No outstanding balances</p>
      </div>
    );
  }

  const mySettlements = settlements.filter((s) => s.from === currentUserId);
  const otherSettlements = settlements.filter((s) => s.from !== currentUserId);

  return (
    <div className="flex flex-col gap-3">
      {mySettlements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">You owe</p>
          {mySettlements.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl p-4 border flex items-center gap-3 mb-2 ${
                settled.has(s.to) ? "border-green-200 bg-green-50" : "border-gray-100"
              }`}
            >
              <div className="flex-1">
                <p className="text-sm text-gray-500">
                  You → <span className="font-semibold text-gray-900">{getName(s.to)}</span>
                </p>
                <p className="text-lg font-bold text-gray-900">₹{s.amount.toFixed(0)}</p>
              </div>
              {settled.has(s.to) ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <span className="text-white text-lg">✓</span>
                </motion.div>
              ) : (
                <button
                  onClick={() => handlePay(s)}
                  disabled={settling.has(s.to)}
                  className="py-2.5 px-4 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: "#25D366" }}
                >
                  Pay via UPI
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {otherSettlements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Others owe</p>
          {otherSettlements.map((s, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between mb-2"
            >
              <div>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{getName(s.from)}</span> → {getName(s.to)}
                </p>
                <p className="text-base font-semibold text-gray-700">₹{s.amount.toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
