import type { TripMember } from "@/store/tripStore";

interface Props {
  members: TripMember[];
  max?: number;
  size?: "sm" | "md";
}

const COLORS = [
  "bg-orange-400",
  "bg-green-400",
  "bg-blue-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-amber-400",
  "bg-teal-400",
  "bg-red-400",
];

export function MemberAvatarRow({ members, max = 8, size = "md" }: Props) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";

  return (
    <div className="flex -space-x-2">
      {visible.map((m, i) => (
        <div
          key={m.user_id}
          className={`${sizeClass} ${COLORS[i % COLORS.length]} rounded-full ring-2 ring-white flex items-center justify-center font-semibold text-white shrink-0`}
          title={m.display_name ?? m.user_id.slice(0, 8)}
        >
          {(m.display_name ?? m.user_id)[0].toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div className={`${sizeClass} bg-gray-200 rounded-full ring-2 ring-white flex items-center justify-center text-gray-600 font-medium shrink-0`}>
          +{overflow}
        </div>
      )}
    </div>
  );
}
