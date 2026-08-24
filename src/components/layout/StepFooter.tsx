"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TRIP_STEPS, nextStep, previousStep, stepIndex } from "@/lib/tripProgress";

/**
 * What the page knows about its own unsaved work. This drives the button copy,
 * so the label always answers two questions at once: is my work safe, and where
 * am I going.
 *
 *  empty  - nothing entered yet, moving on is fine
 *  dirty  - there are unsaved edits; the tap will save them
 *  saving - a save is in flight
 *  saved  - nothing pending, the tap just navigates
 */
export type StepWorkState = "empty" | "dirty" | "saving" | "saved";

interface Props {
  slug: string;
  /** Path segment of the step this footer belongs to, e.g. "budget". */
  current: string;
  workState?: StepWorkState;
  /**
   * Called before navigating when there are unsaved edits. Return false to stay
   * on the page (validation failed, request errored).
   */
  onSave?: () => Promise<boolean>;
}

export function StepFooter({ slug, current, workState = "saved", onSave }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const prev = previousStep(current);
  const next = nextStep(current);
  const index = stepIndex(current);

  const backHref = prev ? `/t/${slug}/${prev.path}` : `/t/${slug}`;
  const backLabel = prev ? `‹ ${prev.title}` : "‹ Trip home";
  const forwardHref = next ? `/t/${slug}/${next.path}` : `/t/${slug}`;

  const saving = busy || workState === "saving";

  function forwardLabel(): string {
    if (saving) return "Saving…";
    if (!next) return "Done · Back to trip ›";
    if (workState === "dirty") return "Save & continue ›";
    if (workState === "empty") return "Skip for now ›";
    return `Next: ${next.title} ›`;
  }

  async function handleForward() {
    if (saving) return;

    // Only run the save when there is actually something to save. Pages that
    // autosave (destinations) never report "dirty" and fall straight through.
    if (workState === "dirty" && onSave) {
      setBusy(true);
      let ok = false;
      try {
        ok = await onSave();
      } catch {
        ok = false;
      }
      setBusy(false);
      if (!ok) return;
    }

    router.push(forwardHref);
  }

  return (
    <div
      className="fixed bottom-0 z-40"
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        padding: "10px 16px calc(10px + env(safe-area-inset-bottom, 0px))",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <button
        onClick={() => router.push(backHref)}
        style={{
          flexShrink: 0,
          minHeight: 44,
          padding: "0 12px",
          borderRadius: 12,
          border: "none",
          background: "none",
          color: "var(--tb-muted)",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {backLabel}
      </button>

      <span
        style={{
          flex: 1,
          textAlign: "center",
          fontSize: 10.5,
          fontWeight: 500,
          color: "var(--tb-light)",
          whiteSpace: "nowrap",
        }}
      >
        Step {index + 1} of {TRIP_STEPS.length}
      </span>

      <button
        onClick={handleForward}
        disabled={saving}
        style={{
          flexShrink: 0,
          minHeight: 44,
          padding: "0 18px",
          borderRadius: 14,
          border: "none",
          background: saving
            ? "rgba(0,0,0,0.12)"
            : "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))",
          color: "#fff",
          fontSize: 13.5,
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: saving ? "wait" : "pointer",
          boxShadow: saving ? "none" : "0 3px 10px rgba(255,107,53,0.22)",
          whiteSpace: "nowrap",
          transition: "all 0.2s ease",
        }}
      >
        {forwardLabel()}
      </button>
    </div>
  );
}
