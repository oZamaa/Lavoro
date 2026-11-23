import { beforeEach, describe, expect, it } from "vitest";
import { createDatabase, type AppDatabase } from "@/db/client";
import {
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  moveApplication,
  updateApplication,
} from "@/lib/applications";
import { createColumn, deleteColumn, listColumns, updateColumn } from "@/lib/columns";
import { HttpError } from "@/lib/http";

let db: AppDatabase;
let todo: number;
let applied: number;
let interview: number;

beforeEach(() => {
  db = createDatabase(":memory:");
  const [a, b, c] = listColumns(db);
  if (!a || !b || !c) throw new Error("seed missing");
  [todo, applied, interview] = [a.id, b.id, c.id];
});

const add = (company: string, columnId?: number) =>
  createApplication(db, { company, title: "Dev", columnId });

const namesIn = (columnId: number) =>
  listApplications(db)
    .filter((a) => a.columnId === columnId)
    .sort((x, y) => x.position - y.position)
    .map((a) => a.company);

describe("applications", () => {
  it("creates in the first column by default, appends and logs history", () => {
    const a = add("A");
    const b = add("B");
    expect(a.columnId).toBe(todo);
    expect([a.position, b.position]).toEqual([0, 1]);
    const detail = getApplication(db, a.id);
    expect(detail.history).toHaveLength(1);
    expect(detail.history[0]).toMatchObject({ fromColumnId: null, toColumnId: todo });
  });

  it("rejects an unknown column on create", () => {
    expect(() => add("A", 9999)).toThrow(HttpError);
  });

  it("updates fields and bumps updatedAt", () => {
    const a = add("A");
    const updated = updateApplication(db, a.id, { notes: "à relancer", city: null });
    expect(updated.notes).toBe("à relancer");
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(a.updatedAt.getTime());
    expect(() => updateApplication(db, 9999, { notes: "x" })).toThrow(HttpError);
  });

  it("deletes and 404s afterwards", () => {
    const a = add("A");
    deleteApplication(db, a.id);
    expect(() => getApplication(db, a.id)).toThrow(HttpError);
    expect(() => deleteApplication(db, a.id)).toThrow(HttpError);
  });

  it("moves across columns at a given index and logs the change", () => {
    const a = add("A");
    const b = add("B");
    const c = add("C", applied);
    const d = add("D", applied);

    moveApplication(db, b.id, { columnId: applied, position: 1 });
    expect(namesIn(todo)).toEqual(["A"]);
    expect(namesIn(applied)).toEqual(["C", "B", "D"]);
    expect(listApplications(db).find((x) => x.id === b.id)?.position).toBe(1);

    const history = getApplication(db, b.id).history;
    expect(history[0]).toMatchObject({ fromColumnId: todo, toColumnId: applied });
    expect(history).toHaveLength(2);
    expect([a, c, d].length).toBe(3);
  });

  it("keeps source positions contiguous and appends when position is omitted", () => {
    const a = add("A");
    add("B");
    add("C");
    moveApplication(db, a.id, { columnId: interview });
    expect(
      listApplications(db)
        .filter((x) => x.columnId === todo)
        .map((x) => x.position),
    ).toEqual([0, 1]);
    expect(namesIn(interview)).toEqual(["A"]);
  });

  it("reorders inside the same column without a history entry", () => {
    const a = add("A");
    add("B");
    const c = add("C");
    moveApplication(db, c.id, { columnId: todo, position: 0 });
    expect(namesIn(todo)).toEqual(["C", "A", "B"]);
    expect(getApplication(db, c.id).history).toHaveLength(1);
    moveApplication(db, a.id, { columnId: todo, position: 99 });
    expect(namesIn(todo)).toEqual(["C", "B", "A"]);
  });

  it("404s when moving to an unknown column or unknown card", () => {
    const a = add("A");
    expect(() => moveApplication(db, a.id, { columnId: 9999 })).toThrow(HttpError);
    expect(() => moveApplication(db, 9999, { columnId: todo })).toThrow(HttpError);
  });
});

describe("columns", () => {
  it("creates at the end", () => {
    const col = createColumn(db, { name: "Rappel" });
    expect(col.position).toBe(listColumns(db).length - 1);
  });

  it("renames and reorders with contiguous positions", () => {
    updateColumn(db, interview, { name: "Entretiens", position: 0 });
    const cols = listColumns(db);
    expect(cols[0]).toMatchObject({ id: interview, name: "Entretiens" });
    expect(cols.map((c) => c.position)).toEqual(cols.map((_, i) => i));
  });

  it("refuses to delete a non-empty column (409) and deletes an empty one", () => {
    add("A", applied);
    try {
      deleteColumn(db, applied);
      expect.unreachable();
    } catch (e) {
      expect((e as HttpError).status).toBe(409);
    }
    deleteColumn(db, interview);
    expect(listColumns(db).some((c) => c.id === interview)).toBe(false);
    expect(listColumns(db).map((c) => c.position)).toEqual(listColumns(db).map((_, i) => i));
    expect(() => deleteColumn(db, interview)).toThrow(HttpError);
  });
});
