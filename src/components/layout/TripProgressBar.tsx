"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TRIP_STEPS, type StepState } from "@/lib/tripProgress";

interface Props {
  slug: string;
  /** Step path -> state, computed server-side from real trip data. */
  states: Record<string, StepState>;
}

const DONE_GRADIENT = "linear-gradient(90deg, #25D366, #2EE07A)";

/**
 * The persistent five-step tracker. This replaced the bottom icon nav, so it is
 * the only always-visible way to see where the group is and to jump between
 * steps. Every segment stays tappable: pages handle their own empty states, and
 * a step you cannot reach is how people conclude the app is broken.
 */
export function TripProgressBar({ slug, states }: Props) {
  const pathname = usePathname();

  // On the dashboard no step is "open", so nothing is underlined.
  const activePath = TRIP_STEPS.find(
    (step) => pathname === `/t/${slug}/${step.path}`
  )?.path;

  return (
    <nav
      aria-label="Trip progress"
      className="fixed z-40"
      style={{
        top: 52,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        padding: "8px 12px 7px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {TRIP_STEPS.map((step) => {
          const state = states[step.path] ?? "upcoming";
          const isActive = activePath === step.path;
          const isDone = state === "done";
          const isCurrent = state === "current";

          // The bar shows progress; the underline shows which page is open.
          // They are different things and can point at different steps.
          const barBackground = isDone
            ? DONE_GRADIENT
            : isCurrent
              ? `linear-gradient(90deg, ${step.color}, ${step.color}90)`
              : "rgba(0,0,0,0.06)";

          const labelColor = isActive
            ? step.color
            : isDone
              ? "#25D366"
              : isCurrent
                ? step.color
                : "var(--tb-light)";

          return (
            <Link
              key={step.path}
              href={`/t/${slug}/${step.path}`}
              aria-current={isActive ? "page" : undefined}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                textDecoration: "none",
                minHeight: 44,
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: 4,
                  borderRadius: 100,
                  background: barBackground,
                  transition: "background 0.25s ease",
                }}
              />
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: isActive || isCurrent ? 700 : 500,
                  color: labelColor,
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  whiteSpace: "nowrap",
                  borderBottom: isActive ? `1.5px solid ${step.color}` : "1.5px solid transparent",
                  paddingBottom: 1,
                  transition: "all 0.2s ease",
                }}
              >
                {isDone && <span aria-hidden>✓</span>}
                {step.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
