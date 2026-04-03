import type { TripStatus } from "@/types/database";

const STATUS_CONFIG: Record<TripStatus, { label: string; className: string }> = {
  gathering_inputs: { label: "Gathering inputs", className: "bg-blue-100 text-blue-700" },
  voting: { label: "Voting", className: "bg-amber-100 text-amber-700" },
  planning: { label: "Planning", className: "bg-purple-100 text-purple-700" },
  active: { label: "Active trip", className: "bg-green-100 text-green-700" },
  completed: { label: "Completed", className: "bg-gray-100 text-gray-600" },
};

export function StatusBadge({ status }: { status: TripStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
