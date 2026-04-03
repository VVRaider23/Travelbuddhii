"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buildUpiDeepLink } from "@/lib/upi";

function PayRedirect() {
  const searchParams = useSearchParams();
  const [redirected, setRedirected] = useState(false);

  const pa = searchParams.get("pa") ?? "";
  const pn = searchParams.get("pn") ?? "";
  const am = searchParams.get("am") ?? "";
  const tn = searchParams.get("tn") ?? "TripSync settlement";

  useEffect(() => {
    if (!pa || !am) return;

    const deepLink = buildUpiDeepLink({ pa, pn, am: parseFloat(am), tn });
    window.location.href = deepLink;
    setRedirected(true);

    // Log event
    fetch("/api/events/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "settlement_link_opened" }),
    }).catch(() => {});
  }, [pa, pn, am, tn]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6 text-center">
        <div className="text-5xl">💸</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opening UPI...</h1>
          {pa && (
            <p className="text-sm text-gray-500 mt-1">
              Paying <span className="font-semibold">{pn || pa}</span>{" "}
              <span className="text-green-600 font-semibold">₹{am}</span>
            </p>
          )}
        </div>

        {redirected && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-medium">UPI ID</p>
            <p className="text-sm font-mono text-gray-800 mt-0.5">{pa}</p>
          </div>
        )}

        <p className="text-xs text-gray-400">
          If the UPI app didn&apos;t open, copy the UPI ID above and pay manually.
        </p>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <PayRedirect />
    </Suspense>
  );
}
