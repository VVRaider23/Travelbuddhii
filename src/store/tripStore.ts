"use client";

import { create } from "zustand";
import type { TripStatus, MemberRole } from "@/types/database";
import type { Settlement } from "@/lib/settlement";

export interface TripMember {
  user_id: string;
  role: MemberRole;
  joined_at: string;
  display_name?: string;
  avatar_url?: string;
  upi_id?: string;
}

export interface ItineraryItem {
  id: string;
  day_number: number;
  position: number;
  place_name: string;
  place_id: string | null;
  coordinates: { lat: number; lng: number } | null;
  category: "activity" | "meal" | "transport" | "accommodation";
  notes: string | null;
  booking_url: string | null;
  booking_platform: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  is_offbeat: boolean;
  how_to_get_there: string | null;
}

export interface ChatMessage {
  id: string;
  user_id: string | null;
  content: string;
  role: "user" | "assistant";
  created_at: string;
}

export interface Expense {
  id: string;
  paid_by: string;
  amount: number;
  description: string;
  category: string;
  created_at: string;
  splits: {
    user_id: string;
    amount: number;
    is_settled: boolean;
  }[];
}

export interface Destination {
  id: string;
  name: string;
  pitch: string;
  estimated_cost_min: number | null;
  estimated_cost_max: number | null;
  pros: string[];
  cons: string[];
  travel_options: unknown;
  why_fits_group: string | null;
  google_place_id: string | null;
  photo_url: string | null;
  ai_generated: boolean;
}

export type GenerationState = "idle" | "loading" | "streaming" | "done" | "error";

interface TripStore {
  // Identity
  tripId: string | null;
  tripSlug: string | null;
  tripName: string | null;
  userRole: MemberRole | null;
  tripStatus: TripStatus | null;
  currentUserId: string | null;

  // Dates
  dateWindowStart: string | null;
  dateWindowEnd: string | null;
  confirmedStart: string | null;
  confirmedEnd: string | null;

  // Members
  members: TripMember[];

  // Date polling
  dateVotes: Record<string, Record<string, boolean>>;   // userId → date → isAvailable
  heatmap: Record<string, number>;                       // date → count of available
  isAnonymous: boolean;
  datePollDeadline: string | null;

  // Budget
  budgetMin: number | null;
  budgetMax: number | null;
  tripVibes: string[];
  myBudgetVote: { min: number; max: number } | null;
  myVibes: string[];
  groupBudgetOverlap: { min: number; max: number } | null;
  groupVibes: Record<string, number>;                    // vibe → count

  // Destinations
  destinations: Destination[];
  myVoteRanking: string[];
  destinationBordaScores: Record<string, number>;

  // Itinerary
  itineraryByDay: Record<number, ItineraryItem[]>;
  chatHistory: ChatMessage[];
  generationState: GenerationState;

  // Expenses
  expenses: Expense[];
  balances: Record<string, number>;
  settlements: Settlement[];

  // Actions
  setTripData: (data: Partial<TripStore>) => void;
  updateHeatmap: (userId: string, date: string, isAvailable: boolean) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setGenerationState: (state: GenerationState) => void;
  updateItineraryItem: (item: ItineraryItem) => void;
  addMember: (member: TripMember) => void;
}

export const useTripStore = create<TripStore>((set) => ({
  tripId: null,
  tripSlug: null,
  tripName: null,
  userRole: null,
  tripStatus: null,
  currentUserId: null,
  dateWindowStart: null,
  dateWindowEnd: null,
  confirmedStart: null,
  confirmedEnd: null,
  members: [],
  dateVotes: {},
  heatmap: {},
  isAnonymous: false,
  datePollDeadline: null,
  budgetMin: null,
  budgetMax: null,
  tripVibes: [],
  myBudgetVote: null,
  myVibes: [],
  groupBudgetOverlap: null,
  groupVibes: {},
  destinations: [],
  myVoteRanking: [],
  destinationBordaScores: {},
  itineraryByDay: {},
  chatHistory: [],
  generationState: "idle",
  expenses: [],
  balances: {},
  settlements: [],

  setTripData: (data) => set((state) => ({ ...state, ...data })),

  updateHeatmap: (userId, date, isAvailable) =>
    set((state) => {
      const dateVotes = {
        ...state.dateVotes,
        [userId]: { ...(state.dateVotes[userId] ?? {}), [date]: isAvailable },
      };
      const heatmap: Record<string, number> = {};
      for (const votes of Object.values(dateVotes)) {
        for (const [d, available] of Object.entries(votes)) {
          if (available) heatmap[d] = (heatmap[d] ?? 0) + 1;
        }
      }
      return { dateVotes, heatmap };
    }),

  addChatMessage: (msg) =>
    set((state) => ({ chatHistory: [...state.chatHistory, msg] })),

  setGenerationState: (generationState) => set({ generationState }),

  updateItineraryItem: (item) =>
    set((state) => {
      const day = state.itineraryByDay[item.day_number] ?? [];
      const existing = day.findIndex((i) => i.id === item.id);
      const updated =
        existing >= 0
          ? day.map((i) => (i.id === item.id ? item : i))
          : [...day, item].sort((a, b) => a.position - b.position);
      return {
        itineraryByDay: { ...state.itineraryByDay, [item.day_number]: updated },
      };
    }),

  addMember: (member) =>
    set((state) => {
      if (state.members.some((m) => m.user_id === member.user_id)) return state;
      return { members: [...state.members, member] };
    }),
}));
