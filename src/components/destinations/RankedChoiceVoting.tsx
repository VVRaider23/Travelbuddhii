"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DestinationCard } from "./DestinationCard";

interface Destination {
  id: string;
  name: string;
  pitch: string;
  estimated_cost_min: number | null;
  estimated_cost_max: number | null;
  pros: string[];
  cons: string[];
  travel_options: { mode: string; duration_hours: number; approximate_cost_inr: number }[];
  photo_url?: string | null;
  why_fits_group?: string | null;
}

interface Props {
  destinations: Destination[];
  initialRanking: string[];
  onSubmit: (ranking: string[]) => void;
  submitting: boolean;
}

function SortableDestination({ dest, rank }: { dest: Destination; rank: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dest.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    position: isDragging ? "relative" as const : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <DestinationCard
        destination={dest}
        rank={rank}
        showRank={true}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function RankedChoiceVoting({ destinations, initialRanking, onSubmit, submitting }: Props) {
  const [ordering, setOrdering] = useState<string[]>(() => {
    if (initialRanking.length > 0) return initialRanking;
    return destinations.map((d) => d.id);
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrdering((items) => {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  const orderedDests = ordering
    .map((id) => destinations.find((d) => d.id === id))
    .filter(Boolean) as Destination[];

  return (
    <div className="flex flex-col gap-4">
      <div
        className="px-4 rounded-2xl mx-4 py-3"
        style={{ backgroundColor: "var(--tb-cream)" }}
      >
        <p className="text-sm font-medium" style={{ color: "var(--tb-orange-dark)" }}>Drag to rank your preferences</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--tb-muted)" }}>Top = most preferred</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ordering} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 px-4">
            {orderedDests.map((dest, i) => (
              <SortableDestination key={dest.id} dest={dest} rank={i + 1} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="px-4">
        <button
          onClick={() => onSubmit(ordering)}
          disabled={submitting}
          className="w-full py-4 rounded-2xl text-white font-semibold text-base disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-dark))" }}
        >
          {submitting ? "Submitting..." : "Submit my ranking →"}
        </button>
      </div>
    </div>
  );
}
