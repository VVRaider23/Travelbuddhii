"use client";

import { useState } from "react";
import { toast } from "sonner";
import { memberDisplayName } from "@/lib/memberProfile";

export interface RosterMember {
  user_id: string;
  role?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  upi_id?: string | null;
}

interface Props {
  slug: string;
  members: RosterMember[];
  currentUserId: string;
  onUpdated: () => void;
}

const AVATAR_COLORS = [
  "#FF6B35", "#25D366", "#3B82F6", "#8B5CF6",
  "#EC4899", "#F59E0B", "#00A8A8", "#EF4444",
];

/**
 * Who is on this trip, and the one place you set your own name and UPI ID.
 *
 * Only your own row is editable. Letting people rename each other sounds
 * friendly until someone does it in a group of fifteen.
 */
export function MemberRoster({ slug, members, currentUserId, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [upi, setUpi] = useState("");

  const me = members.find((m) => m.user_id === currentUserId);
  const unnamedCount = members.filter((m) => !m.display_name).length;

  function startEditing() {
    setName(me?.display_name ?? "");
    setUpi(me?.upi_id ?? "");
    setEditing(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Add a name so the group knows who you are");
      return;
    }

    setSaving(true);
    let ok = false;
    let message = "Could not save your details";
    try {
      const res = await fetch(`/api/trips/${slug}/members/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name.trim(), upi_id: upi.trim() }),
      });
      ok = res.ok;
      if (!ok) message = (await res.json()).error ?? message;
    } catch {
      ok = false;
    }
    setSaving(false);

    if (!ok) {
      toast.error(message);
      return;
    }

    setEditing(false);
    toast.success("Saved");
    onUpdated();
  }

  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: "white", border: "1px solid var(--tb-sand)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: "var(--tb-text)" }}>
          Who&apos;s on this trip
        </p>
        <span className="text-xs" style={{ color: "var(--tb-light)" }}>
          {members.length} {members.length === 1 ? "person" : "people"}
        </span>
      </div>

      {unnamedCount > 0 && (
        <p
          className="text-xs mb-3 px-3 py-2 rounded-lg"
          style={{ backgroundColor: "rgba(255,107,53,0.07)", color: "var(--tb-orange-dark)" }}
        >
          {unnamedCount === 1 ? "1 person hasn't" : `${unnamedCount} people haven't`} added a
          name yet. They can set it here on their own device.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {members.map((member, i) => {
          const isMe = member.user_id === currentUserId;
          const label = memberDisplayName(member);

          return (
            <div key={member.user_id} className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {label[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-sm font-medium truncate"
                    style={{
                      color: member.display_name ? "var(--tb-text)" : "var(--tb-light)",
                      fontStyle: member.display_name ? "normal" : "italic",
                    }}
                  >
                    {label}
                  </span>
                  {isMe && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                      style={{ backgroundColor: "rgba(0,168,168,0.12)", color: "var(--tb-teal-dark)" }}
                    >
                      you
                    </span>
                  )}
                  {member.role === "organizer" && (
                    <span className="text-[10px] shrink-0" style={{ color: "var(--tb-light)" }}>
                      organiser
                    </span>
                  )}
                </div>
                {member.upi_id && (
                  <p className="text-[11px] font-mono truncate" style={{ color: "var(--tb-light)" }}>
                    {member.upi_id}
                  </p>
                )}
              </div>

              {isMe && !editing && (
                <button
                  onClick={startEditing}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0"
                  style={{ color: "var(--tb-orange)", background: "rgba(255,107,53,0.08)", border: "none", cursor: "pointer" }}
                >
                  Edit
                </button>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="mt-3 pt-3 flex flex-col gap-2.5" style={{ borderTop: "1px solid var(--tb-sand)" }}>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: "var(--tb-muted)" }}>
              Your name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="e.g. Vibudh"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ border: "1px solid var(--tb-sand)", color: "var(--tb-text)", backgroundColor: "var(--tb-cream)" }}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: "var(--tb-muted)" }}>
              Your UPI ID <span style={{ color: "var(--tb-light)" }}>(optional)</span>
            </span>
            <input
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              placeholder="name@okhdfcbank"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono"
              style={{ border: "1px solid var(--tb-sand)", color: "var(--tb-text)", backgroundColor: "var(--tb-cream)" }}
            />
            <span className="text-[11px]" style={{ color: "var(--tb-light)" }}>
              Needed so the group can actually pay you back.
            </span>
          </label>

          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ border: "1px solid var(--tb-sand)", background: "white", color: "var(--tb-muted)", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))", border: "none", cursor: saving ? "wait" : "pointer" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
