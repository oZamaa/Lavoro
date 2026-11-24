"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cardDndId, type BoardCard } from "@/lib/board";
import { Card } from "./Card";

export function SortableCard({
  card,
  overdue,
  dragDisabled,
  onOpen,
}: {
  card: BoardCard;
  overdue: boolean;
  dragDisabled: boolean;
  onOpen: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cardDndId(card.id), disabled: dragDisabled });

  // Keyboard users lift the card from a dedicated handle (no interactive element nested in
  // another); mouse and touch users can still drag from anywhere on the card.
  const handle = dragDisabled ? undefined : (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      aria-label={`Déplacer la candidature ${card.company}`}
      onClick={(e) => e.stopPropagation()}
      className="text-muted hover:bg-column hover:text-foreground -mt-1 -mr-2 shrink-0 cursor-grab rounded-md p-1"
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-card touch-manipulation ${isDragging ? "opacity-40" : ""}`}
      {...(dragDisabled ? {} : listeners)}
    >
      <Card card={card} overdue={overdue} onOpen={onOpen} handle={handle} />
    </div>
  );
}
