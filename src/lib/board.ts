/** Pure helpers for the Kanban board state (no React, easy to test). */

export type BoardColumn = { id: number; name: string };

export type BoardCard = {
  id: number;
  company: string;
  title: string;
  city: string | null;
  contract: string | null;
  appliedAt: string | null;
};

/** Cards of each column, in display order. */
export type CardsByColumn = Record<number, BoardCard[]>;

export type CardPosition = { columnId: number; index: number };

export const cardDndId = (id: number) => `card-${id}`;
export const columnDndId = (id: number) => `column-${id}`;

export function parseDndId(raw: string | number): { type: "card" | "column"; id: number } | null {
  const match = /^(card|column)-(\d+)$/.exec(String(raw));
  if (!match) return null;
  return { type: match[1] as "card" | "column", id: Number(match[2]) };
}

/** Groups cards (already ordered by position) under their column. Every column gets a key. */
export function groupByColumn(
  columns: BoardColumn[],
  cards: (BoardCard & { columnId: number })[],
): CardsByColumn {
  const result: CardsByColumn = {};
  for (const column of columns) result[column.id] = [];
  for (const { columnId, ...card } of cards) {
    result[columnId]?.push(card);
  }
  return result;
}

export function findCardColumn(state: CardsByColumn, cardId: number): number | undefined {
  for (const [columnId, cards] of Object.entries(state)) {
    if (cards.some((c) => c.id === cardId)) return Number(columnId);
  }
  return undefined;
}

export function positionOf(state: CardsByColumn, cardId: number): CardPosition | undefined {
  const columnId = findCardColumn(state, cardId);
  if (columnId === undefined) return undefined;
  const index = (state[columnId] ?? []).findIndex((c) => c.id === cardId);
  return { columnId, index };
}

/** Resolves what a drag is hovering: a column (drop at the end) or a card (drop at its index). */
export function resolveTarget(
  state: CardsByColumn,
  overId: string | number,
): (CardPosition & { overType: "card" | "column" }) | null {
  const parsed = parseDndId(overId);
  if (!parsed) return null;
  if (parsed.type === "column") {
    const cards = state[parsed.id];
    if (!cards) return null;
    return { columnId: parsed.id, index: cards.length, overType: "column" };
  }
  const position = positionOf(state, parsed.id);
  return position ? { ...position, overType: "card" } : null;
}

/** Returns a new state where the card sits at `toIndex` of `toColumnId` (index clamped). */
export function moveCard(
  state: CardsByColumn,
  cardId: number,
  toColumnId: number,
  toIndex: number,
): CardsByColumn {
  const fromColumnId = findCardColumn(state, cardId);
  if (fromColumnId === undefined || !state[toColumnId]) return state;
  const card = (state[fromColumnId] ?? []).find((c) => c.id === cardId);
  if (!card) return state;

  const next: CardsByColumn = { ...state };
  next[fromColumnId] = (state[fromColumnId] ?? []).filter((c) => c.id !== cardId);
  const target = [...(next[toColumnId] ?? [])];
  target.splice(Math.max(0, Math.min(toIndex, target.length)), 0, card);
  next[toColumnId] = target;
  return next;
}

export function samePosition(a: CardPosition | undefined, b: CardPosition | undefined): boolean {
  return !!a && !!b && a.columnId === b.columnId && a.index === b.index;
}
