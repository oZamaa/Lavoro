"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cardDndId, columnDndId, type BoardCard, type BoardColumn } from "@/lib/board";
import { SortableCard } from "./SortableCard";

const DOT_COLORS = [
  "bg-[#bfd4ff]",
  "bg-[#bdeaf5]",
  "bg-[#d5ccff]",
  "bg-[#fbe3a0]",
  "bg-[#bfebd2]",
  "bg-[#f5b5b5]",
];

export function Column({
  column,
  cards,
  colorIndex,
}: {
  column: BoardColumn;
  cards: BoardCard[];
  colorIndex: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDndId(column.id) });
  const dot = DOT_COLORS[colorIndex % DOT_COLORS.length];

  return (
    <section
      aria-label={`${column.name}, ${cards.length} candidature${cards.length > 1 ? "s" : ""}`}
      className={`rounded-column bg-column flex h-full w-[300px] shrink-0 flex-col p-3 transition-shadow duration-150 ${
        isOver ? "ring-foreground/15 ring-2" : ""
      }`}
    >
      <header className="flex items-center gap-2 px-2 py-2">
        <span className={`h-3 w-3 rounded-sm ${dot}`} aria-hidden="true" />
        <h2 className="font-semibold">{column.name}</h2>
        <span className="text-muted ml-auto text-sm">{cards.length}</span>
      </header>
      <SortableContext
        items={cards.map((c) => cardDndId(c.id))}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-3 overflow-y-auto p-1">
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} />
          ))}
          {cards.length === 0 && (
            <p className="rounded-card border-border text-muted border border-dashed p-4 text-center text-sm">
              Aucune candidature
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
