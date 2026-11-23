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
  total,
  colorIndex,
  overdueIds,
  dragDisabled,
  onOpenCard,
}: {
  column: BoardColumn;
  /** Visible cards (after search/filters/sort). */
  cards: BoardCard[];
  /** Number of cards in the column before filtering. */
  total: number;
  colorIndex: number;
  overdueIds: Set<number>;
  dragDisabled: boolean;
  onOpenCard: (id: number) => void;
}) {
  const filtered = cards.length !== total;
  const { setNodeRef, isOver } = useDroppable({ id: columnDndId(column.id) });
  const dot = DOT_COLORS[colorIndex % DOT_COLORS.length];

  return (
    <section
      aria-label={`${column.name}, ${
        filtered ? `${cards.length} sur ${total}` : cards.length
      } candidature${total > 1 ? "s" : ""}`}
      className={`rounded-column bg-column flex h-full w-[300px] shrink-0 flex-col p-3 transition-shadow duration-150 ${
        isOver ? "ring-foreground/15 ring-2" : ""
      }`}
    >
      <header className="flex items-center gap-2 px-2 py-2">
        <span className={`h-3 w-3 rounded-sm ${dot}`} aria-hidden="true" />
        <h2 className="font-semibold">{column.name}</h2>
        <span className="text-muted ml-auto text-sm" aria-hidden="true">
          {filtered ? `${cards.length}/${total}` : total}
        </span>
      </header>
      <SortableContext
        items={cards.map((c) => cardDndId(c.id))}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-3 overflow-y-auto p-1">
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              overdue={overdueIds.has(card.id)}
              dragDisabled={dragDisabled}
              onOpen={() => onOpenCard(card.id)}
            />
          ))}
          {cards.length === 0 && (
            <p className="rounded-card border-border text-muted border border-dashed p-4 text-center text-sm">
              {total === 0 ? "Aucune candidature" : "Aucun résultat"}
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
