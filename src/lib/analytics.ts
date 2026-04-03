const EVENT_TYPES = [
  "link_opened",
  "trip_joined",
  "date_vote_completed",
  "budget_submitted",
  "destination_voted",
  "itinerary_viewed",
  "chat_message_sent",
  "expense_added",
  "settlement_link_opened",
  "nudge_sent",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export async function logEvent(
  eventType: EventType,
  options: {
    tripId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    await fetch("/api/events/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        trip_id: options.tripId,
        user_id: options.userId,
        metadata: options.metadata ?? {},
      }),
    });
  } catch {
    // Non-critical — never throw on analytics failure
  }
}
