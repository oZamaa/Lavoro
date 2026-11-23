"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cardDndId(card.id),
    disabled: dragDisabled,
  });

  // While filtering/sorting, manual ordering is off: no drag handlers, no "button" role.
  const dragProps = dragDisabled ? {} : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-card touch-manipulation ${isDragging ? "opacity-40" : ""}`}
      {...dragProps}
    >
      <Card card={card} overdue={overdue} onOpen={onOpen} />
    </div>
  );
}
