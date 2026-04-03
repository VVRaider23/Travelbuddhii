// Hand-written types matching the Supabase schema in 001_initial_schema.sql

export type TripStatus =
  | "gathering_inputs"
  | "voting"
  | "planning"
  | "active"
  | "completed";

export type MemberRole = "organizer" | "member";

export type ItemCategory = "activity" | "meal" | "transport" | "accommodation";

export type ChatRole = "user" | "assistant";

export type EventType =
  | "link_opened"
  | "trip_joined"
  | "date_vote_completed"
  | "budget_submitted"
  | "destination_voted"
  | "itinerary_viewed"
  | "chat_message_sent"
  | "expense_added"
  | "settlement_link_opened"
  | "nudge_sent";
