import { describe, expect, it } from "vitest";
import {
  findCardColumn,
  groupByColumn,
  moveCard,
  parseDndId,
  positionOf,
  removeCard,
  resolveTarget,
  upsertCard,
  samePosition,
  type BoardCard,
} from "@/lib/board";

const card = (id: number, columnId: number): BoardCard & { columnId: number } => ({
  id,
  columnId,
  company: `C${id}`,
  title: "Dev",
  city: null,
  contract: null,
  appliedAt: null,
});

const columns = [
  { id: 1, name: "A" },
  { id: 2, name: "B" },
  { id: 3, name: "C" },
];
const initial = groupByColumn(columns, [card(10, 1), card(11, 1), card(12, 2)]);
const ids = (state: typeof initial, columnId: number) => (state[columnId] ?? []).map((c) => c.id);

describe("board helpers", () => {
  it("groups cards and keeps empty columns", () => {
    expect(ids(initial, 1)).toEqual([10, 11]);
    expect(ids(initial, 2)).toEqual([12]);
    expect(ids(initial, 3)).toEqual([]);
    expect(initial[1]?.[0]).not.toHaveProperty("columnId");
  });

  it("parses dnd ids", () => {
    expect(parseDndId("card-4")).toEqual({ type: "card", id: 4 });
    expect(parseDndId("column-2")).toEqual({ type: "column", id: 2 });
    expect(parseDndId("nope")).toBeNull();
  });

  it("finds a card's position", () => {
    expect(findCardColumn(initial, 12)).toBe(2);
    expect(positionOf(initial, 11)).toEqual({ columnId: 1, index: 1 });
    expect(positionOf(initial, 99)).toBeUndefined();
  });

  it("resolves a drop over a card or an (empty) column", () => {
    expect(resolveTarget(initial, "card-11")).toMatchObject({ columnId: 1, index: 1 });
    expect(resolveTarget(initial, "column-3")).toMatchObject({ columnId: 3, index: 0 });
    expect(resolveTarget(initial, "column-1")).toMatchObject({ columnId: 1, index: 2 });
    expect(resolveTarget(initial, "column-99")).toBeNull();
  });

  it("moves across columns without mutating the input", () => {
    const next = moveCard(initial, 10, 2, 0);
    expect(ids(next, 1)).toEqual([11]);
    expect(ids(next, 2)).toEqual([10, 12]);
    expect(ids(initial, 1)).toEqual([10, 11]);
  });

  it("reorders inside a column and clamps the index", () => {
    expect(ids(moveCard(initial, 10, 1, 1), 1)).toEqual([11, 10]);
    expect(ids(moveCard(initial, 10, 1, 99), 1)).toEqual([11, 10]);
    expect(ids(moveCard(initial, 11, 1, 0), 1)).toEqual([11, 10]);
  });

  it("drops into an empty column and ignores unknown targets", () => {
    expect(ids(moveCard(initial, 12, 3, 0), 3)).toEqual([12]);
    expect(moveCard(initial, 12, 99, 0)).toBe(initial);
    expect(moveCard(initial, 99, 1, 0)).toBe(initial);
  });

  it("removes a card", () => {
    const next = removeCard(initial, 10);
    expect(ids(next, 1)).toEqual([11]);
    expect(removeCard(initial, 99)).toBe(initial);
  });

  it("upserts: appends new cards, updates in place, moves to the end on column change", () => {
    const fresh = { ...card(20, 3) };
    expect(ids(upsertCard(initial, fresh), 3)).toEqual([20]);

    const renamed = upsertCard(initial, { ...card(10, 1), company: "Renommée" });
    expect(ids(renamed, 1)).toEqual([10, 11]);
    expect(renamed[1]?.[0]?.company).toBe("Renommée");

    const moved = upsertCard(initial, card(10, 2));
    expect(ids(moved, 1)).toEqual([11]);
    expect(ids(moved, 2)).toEqual([12, 10]);

    expect(upsertCard(initial, card(30, 99))).toBe(initial);
  });

  it("compares positions", () => {
    expect(samePosition({ columnId: 1, index: 0 }, { columnId: 1, index: 0 })).toBe(true);
    expect(samePosition({ columnId: 1, index: 0 }, { columnId: 2, index: 0 })).toBe(false);
    expect(samePosition(undefined, undefined)).toBe(false);
  });
});
