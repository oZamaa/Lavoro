"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cardDndId, type BoardCard } from "@/lib/board";
import { Card } from "./Card";

export function SortableCard({ card, onOpen }: { card: BoardCard; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cardDndId(card.id),
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-card touch-manipulation ${isDragging ? "opacity-40" : ""}`}
      {...attributes}
      {...listeners}
    >
      <Card card={card} onOpen={onOpen} />
    </div>
  );
}
