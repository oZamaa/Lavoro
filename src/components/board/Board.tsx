"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRef, useState } from "react";
import {
  findCardColumn,
  groupByColumn,
  moveCard,
  parseDndId,
  positionOf,
  resolveTarget,
  samePosition,
  type BoardCard,
  type BoardColumn,
  type CardPosition,
  type CardsByColumn,
} from "@/lib/board";
import { Card } from "./Card";
import { Column } from "./Column";

type CardWithColumn = BoardCard & { columnId: number };

const instructions: ScreenReaderInstructions = {
  draggable:
    "Pour déplacer cette candidature, appuyez sur Espace ou Entrée. Utilisez les flèches pour la déplacer, Espace ou Entrée pour la déposer, Échap pour annuler.",
};

export function Board({
  columns,
  initialCards,
}: {
  columns: BoardColumn[];
  initialCards: CardWithColumn[];
}) {
  const [state, setState] = useState<CardsByColumn>(() => groupByColumn(columns, initialCards));
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const snapshot = useRef<{ state: CardsByColumn; position: CardPosition } | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const cardById = (id: number): BoardCard | undefined =>
    Object.values(state)
      .flat()
      .find((c) => c.id === id);

  const columnName = (id: number) => columns.find((c) => c.id === id)?.name ?? "";

  const describe = (rawId: string | number): string => {
    const parsed = parseDndId(rawId);
    if (!parsed) return "";
    if (parsed.type === "column") return `la colonne ${columnName(parsed.id)}`;
    return cardById(parsed.id)?.company ?? "la candidature";
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `${describe(active.id)} soulevée.`,
    onDragOver: ({ active, over }) =>
      over ? `${describe(active.id)} est au-dessus de ${describe(over.id)}.` : "",
    onDragEnd: ({ active, over }) =>
      over ? `${describe(active.id)} déposée près de ${describe(over.id)}.` : "Déplacement annulé.",
    onDragCancel: ({ active }) => `Déplacement annulé, ${describe(active.id)} est revenue.`,
  };

  async function reloadFromServer() {
    try {
      const res = await fetch("/api/applications", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      setState(groupByColumn(columns, (await res.json()) as CardWithColumn[]));
    } catch {
      /* keep the current state; the error banner is already displayed */
    }
  }

  function persistMove(cardId: number, target: CardPosition) {
    // Sequential requests keep the server order identical to the user's order.
    queue.current = queue.current.then(async () => {
      try {
        const res = await fetch(`/api/applications/${cardId}/move`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ columnId: target.columnId, position: target.index }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setError(null);
      } catch {
        setError("Le déplacement n'a pas pu être enregistré. Le tableau a été rechargé.");
        await reloadFromServer();
      }
    });
  }

  function handleDragStart({ active }: DragStartEvent) {
    const parsed = parseDndId(active.id);
    if (parsed?.type !== "card") return;
    const position = positionOf(state, parsed.id);
    if (!position) return;
    snapshot.current = { state, position };
    setActiveCard(cardById(parsed.id) ?? null);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    const activeParsed = parseDndId(active.id);
    if (!over || activeParsed?.type !== "card") return;

    setState((current) => {
      const from = findCardColumn(current, activeParsed.id);
      const target = resolveTarget(current, over.id);
      if (from === undefined || !target || from === target.columnId) return current;

      let index = target.index;
      if (target.overType === "card") {
        const translated = active.rect.current.translated;
        const below = !!translated && translated.top > over.rect.top + over.rect.height / 2;
        if (below) index += 1;
      }
      return moveCard(current, activeParsed.id, target.columnId, index);
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const activeParsed = parseDndId(active.id);
    const start = snapshot.current;
    snapshot.current = null;
    setActiveCard(null);
    if (activeParsed?.type !== "card" || !start) return;

    let next = state;
    if (over) {
      const from = findCardColumn(state, activeParsed.id);
      const target = resolveTarget(state, over.id);
      if (from !== undefined && target && from === target.columnId) {
        const oldIndex = (state[from] ?? []).findIndex((c) => c.id === activeParsed.id);
        const newIndex = target.overType === "card" ? target.index : (state[from] ?? []).length - 1;
        if (oldIndex !== newIndex) next = moveCard(state, activeParsed.id, from, newIndex);
      }
    } else {
      next = start.state;
    }

    setState(next);
    const final = positionOf(next, activeParsed.id);
    if (final && !samePosition(final, start.position)) persistMove(activeParsed.id, final);
  }

  function handleDragCancel() {
    if (snapshot.current) setState(snapshot.current.state);
    snapshot.current = null;
    setActiveCard(null);
  }

  return (
    <>
      {error && (
        <p
          role="alert"
          className="rounded-button border-danger text-danger mb-3 border px-4 py-2 text-sm"
        >
          {error}
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        accessibility={{ announcements, screenReaderInstructions: instructions }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2">
          {columns.map((column, index) => (
            <Column
              key={column.id}
              column={column}
              cards={state[column.id] ?? []}
              colorIndex={index}
            />
          ))}
        </div>
        <DragOverlay>{activeCard ? <Card card={activeCard} dragging /> : null}</DragOverlay>
      </DndContext>
    </>
  );
}
