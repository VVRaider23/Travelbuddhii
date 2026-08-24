/**
 * The five steps of a trip, and where the group currently stands in them.
 *
 * Completion is derived from real trip data rather than `trips.status`.
 * Nothing in the codebase ever writes the `active` or `completed` statuses, so
 * anything keyed off them would sit permanently unfinished.
 */

export type StepState = "done" | "current" | "upcoming";

export interface TripStep {
  /** URL segment under /t/<slug>/ */
  path: string;
  /** Short label for the progress bar, where horizontal space is tight. */
  label: string;
  /** Full label for the dashboard checklist and the Next button. */
  title: string;
  desc: string;
  icon: string;
  color: string;
}

export const TRIP_STEPS: TripStep[] = [
  { path: "dates",        label: "Dates",  title: "Dates",       desc: "Vote on when everyone's free",   icon: "📅", color: "#FF6B35" },
  { path: "budget",       label: "Budget", title: "Budget",      desc: "Set your range (stays private)", icon: "💰", color: "#00A8A8" },
  { path: "destinations", label: "Where",  title: "Destination", desc: "Suggestions, then the group votes", icon: "🗺️", color: "#8B5CF6" },
  { path: "itinerary",    label: "Plan",   title: "Itinerary",   desc: "Day-by-day plan with bookings",  icon: "✈️", color: "#10B981" },
  { path: "expenses",     label: "Money",  title: "Expenses",    desc: "Split and settle via UPI",       icon: "💸", color: "#EC4899" },
];

/** What we need to know to decide which steps are finished. */
export interface TripProgressInput {
  confirmedStart: string | null;
  budgetMin: number | null;
  destination: string | null;
  itineraryItemCount: number;
  expenseCount: number;
}

function isStepDone(path: string, trip: TripProgressInput): boolean {
  switch (path) {
    case "dates":        return !!trip.confirmedStart;
    case "budget":       return trip.budgetMin !== null;
    case "destinations": return !!trip.destination;
    case "itinerary":    return trip.itineraryItemCount > 0;
    case "expenses":     return trip.expenseCount > 0;
    default:             return false;
  }
}

/**
 * Every step's state, keyed by path. Exactly one step is "current": the first
 * unfinished one. When everything is done, the last step stays current, because
 * expenses keep coming in while a trip is actually happening.
 */
export function getStepStates(trip: TripProgressInput): Record<string, StepState> {
  const done = TRIP_STEPS.map((step) => isStepDone(step.path, trip));
  const firstUnfinished = done.indexOf(false);
  const currentIndex = firstUnfinished === -1 ? TRIP_STEPS.length - 1 : firstUnfinished;

  const states: Record<string, StepState> = {};
  TRIP_STEPS.forEach((step, i) => {
    if (done[i] && i !== currentIndex) states[step.path] = "done";
    else if (i === currentIndex) states[step.path] = "current";
    else states[step.path] = "upcoming";
  });

  return states;
}

export function stepIndex(path: string): number {
  return TRIP_STEPS.findIndex((s) => s.path === path);
}

export function previousStep(path: string): TripStep | null {
  const i = stepIndex(path);
  return i > 0 ? TRIP_STEPS[i - 1] : null;
}

export function nextStep(path: string): TripStep | null {
  const i = stepIndex(path);
  return i >= 0 && i < TRIP_STEPS.length - 1 ? TRIP_STEPS[i + 1] : null;
}
