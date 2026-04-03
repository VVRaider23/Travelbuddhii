import { z } from "zod";

// ─── Destination Generation ───────────────────────────────────────────────────

export const TravelOptionSchema = z.object({
  mode: z.enum(["flight", "train", "bus", "drive"]),
  duration_hours: z.number(),
  approximate_cost_inr: z.number().int(),
});

export const DestinationSuggestionItemSchema = z.object({
  name: z.string(),
  state: z.string(),
  pitch: z.string(),
  estimated_cost_min: z.number().int(),
  estimated_cost_max: z.number().int(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  travel_options: z.array(TravelOptionSchema),
  why_fits_group: z.string(),
});

export const DestinationSuggestionSchema = z.object({
  destinations: z.array(DestinationSuggestionItemSchema),
});

export type DestinationSuggestion = z.infer<typeof DestinationSuggestionSchema>;
export type DestinationItem = z.infer<typeof DestinationSuggestionItemSchema>;
export type TravelOption = z.infer<typeof TravelOptionSchema>;

// ─── Itinerary Generation ─────────────────────────────────────────────────────

export const ItineraryItemSchema = z.object({
  place_name: z.string(),
  category: z.enum(["activity", "meal", "transport", "accommodation"]),
  start_time: z.string().nullable(),
  duration_minutes: z.number().int(),
  notes: z.string(),
  booking_platform: z
    .enum(["makemytrip", "irctc", "redbus", "zomato", "direct", "none"])
    .nullable(),
  search_query: z.string().nullable(),
  is_offbeat: z.boolean().nullable(),
  how_to_get_there: z.string().nullable(),
});

export const ItineraryDaySchema = z.object({
  day_number: z.number().int(),
  theme: z.string(),
  area: z.string(),
  items: z.array(ItineraryItemSchema),
});

export const ItinerarySchema = z.object({
  days: z.array(ItineraryDaySchema),
});

export type Itinerary = z.infer<typeof ItinerarySchema>;
export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;
export type ItineraryItemAI = z.infer<typeof ItineraryItemSchema>;
