import type { User } from "@supabase/supabase-js";

/**
 * Pull a usable name and avatar out of whatever the identity provider handed us,
 * so people are named the moment they join instead of showing up as "User a3f9c1".
 *
 * Google OAuth populates `full_name` and `avatar_url` in user_metadata. Phone
 * OTP sign-ups populate neither and have no email, so they get null and the app
 * asks them to name themselves.
 */

function firstNonEmpty(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

export function nameFromUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const emailLocalPart = user.email ? user.email.split("@")[0] : null;

  return firstNonEmpty(meta.full_name, meta.name, meta.user_name, emailLocalPart);
}

export function avatarFromUser(user: User): string | null {
  const meta = user.user_metadata ?? {};
  return firstNonEmpty(meta.avatar_url, meta.picture);
}

/**
 * What to show when a member has no name yet. Short and obviously a placeholder,
 * so it reads as "not set" rather than as somebody's actual name.
 */
export function fallbackName(userId: string): string {
  return `Member ${userId.slice(0, 4)}`;
}

/** Name for display, falling back to the placeholder. */
export function memberDisplayName(
  member: { user_id: string; display_name?: string | null }
): string {
  return firstNonEmpty(member.display_name) ?? fallbackName(member.user_id);
}
