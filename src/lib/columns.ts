import { asc, count, eq, max, ne } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { applications, columns } from "@/db/schema";
import { HttpError, notFound } from "@/lib/http";
import type { CreateColumnInput, UpdateColumnInput } from "@/lib/validators";

export function listColumns(db: AppDatabase) {
  return db.select().from(columns).orderBy(asc(columns.position), asc(columns.id)).all();
}

export function createColumn(db: AppDatabase, input: CreateColumnInput) {
  const row = db
    .select({ top: max(columns.position) })
    .from(columns)
    .get();
  return db
    .insert(columns)
    .values({ name: input.name, position: (row?.top ?? -1) + 1 })
    .returning()
    .get();
}

/** Renames and/or reorders a column; positions stay contiguous. */
export function updateColumn(db: AppDatabase, id: number, patch: UpdateColumnInput) {
  return db.transaction((tx) => {
    const col = tx.select().from(columns).where(eq(columns.id, id)).get();
    if (!col) throw notFound("Colonne");

    if (patch.name !== undefined) {
      tx.update(columns).set({ name: patch.name }).where(eq(columns.id, id)).run();
    }
    if (patch.position !== undefined) {
      const ids = tx
        .select({ id: columns.id })
        .from(columns)
        .where(ne(columns.id, id))
        .orderBy(asc(columns.position), asc(columns.id))
        .all()
        .map((r) => r.id);
      ids.splice(Math.min(patch.position, ids.length), 0, id);
      ids.forEach((colId, position) => {
        tx.update(columns).set({ position }).where(eq(columns.id, colId)).run();
      });
    }

    const updated = tx.select().from(columns).where(eq(columns.id, id)).get();
    if (!updated) throw notFound("Colonne");
    return updated;
  });
}

export function deleteColumn(db: AppDatabase, id: number): void {
  db.transaction((tx) => {
    const col = tx.select().from(columns).where(eq(columns.id, id)).get();
    if (!col) throw notFound("Colonne");
    const used = tx
      .select({ total: count() })
      .from(applications)
      .where(eq(applications.columnId, id))
      .get();
    if (used && used.total > 0) {
      throw new HttpError(409, "Cette colonne contient encore des candidatures");
    }
    tx.delete(columns).where(eq(columns.id, id)).run();
    tx.select({ id: columns.id })
      .from(columns)
      .orderBy(asc(columns.position), asc(columns.id))
      .all()
      .forEach((row, position) => {
        tx.update(columns).set({ position }).where(eq(columns.id, row.id)).run();
      });
  });
}
