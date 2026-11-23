import { and, asc, desc, eq, max, ne } from "drizzle-orm";
import type { AppDatabase, Tx } from "@/db/client";
import { applications, columns, statusHistory } from "@/db/schema";
import { HttpError, notFound } from "@/lib/http";
import type {
  CreateApplicationInput,
  MoveApplicationInput,
  UpdateApplicationInput,
} from "@/lib/validators";

function assertColumnExists(tx: Tx, columnId: number): void {
  const found = tx.select({ id: columns.id }).from(columns).where(eq(columns.id, columnId)).get();
  if (!found) throw notFound("Colonne");
}

function nextPosition(tx: Tx, columnId: number): number {
  const row = tx
    .select({ top: max(applications.position) })
    .from(applications)
    .where(eq(applications.columnId, columnId))
    .get();
  return (row?.top ?? -1) + 1;
}

/** Rewrites positions 0..n-1 for the given application ids, in order. */
function writePositions(tx: Tx, ids: number[]): void {
  ids.forEach((id, position) => {
    tx.update(applications).set({ position }).where(eq(applications.id, id)).run();
  });
}

function orderedIds(tx: Tx, columnId: number, excludeId?: number): number[] {
  const where =
    excludeId === undefined
      ? eq(applications.columnId, columnId)
      : and(eq(applications.columnId, columnId), ne(applications.id, excludeId));
  return tx
    .select({ id: applications.id })
    .from(applications)
    .where(where)
    .orderBy(asc(applications.position), asc(applications.id))
    .all()
    .map((r) => r.id);
}

export function listApplications(db: AppDatabase) {
  return db
    .select()
    .from(applications)
    .orderBy(asc(applications.columnId), asc(applications.position))
    .all();
}

export function getApplication(db: AppDatabase, id: number) {
  const app = db.select().from(applications).where(eq(applications.id, id)).get();
  if (!app) throw notFound("Candidature");
  const history = db
    .select()
    .from(statusHistory)
    .where(eq(statusHistory.applicationId, id))
    .orderBy(desc(statusHistory.changedAt), desc(statusHistory.id))
    .all();
  return { ...app, history };
}

export function createApplication(db: AppDatabase, input: CreateApplicationInput) {
  return db.transaction((tx) => {
    let columnId = input.columnId;
    if (columnId === undefined) {
      const first = tx
        .select({ id: columns.id })
        .from(columns)
        .orderBy(asc(columns.position))
        .get();
      if (!first) throw new HttpError(409, "Aucune colonne disponible");
      columnId = first.id;
    } else {
      assertColumnExists(tx, columnId);
    }
    const row = tx
      .insert(applications)
      .values({ ...input, columnId, position: nextPosition(tx, columnId) })
      .returning()
      .get();
    tx.insert(statusHistory)
      .values({ applicationId: row.id, fromColumnId: null, toColumnId: columnId })
      .run();
    return row;
  });
}

export function updateApplication(db: AppDatabase, id: number, patch: UpdateApplicationInput) {
  const row = db
    .update(applications)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(applications.id, id))
    .returning()
    .get();
  if (!row) throw notFound("Candidature");
  return row;
}

export function deleteApplication(db: AppDatabase, id: number): void {
  const row = db
    .delete(applications)
    .where(eq(applications.id, id))
    .returning({ id: applications.id })
    .get();
  if (!row) throw notFound("Candidature");
}

/** Moves a card to a column / index, keeps positions contiguous and logs the column change. */
export function moveApplication(db: AppDatabase, id: number, input: MoveApplicationInput) {
  return db.transaction((tx) => {
    const app = tx.select().from(applications).where(eq(applications.id, id)).get();
    if (!app) throw notFound("Candidature");
    assertColumnExists(tx, input.columnId);

    const targetIds = orderedIds(tx, input.columnId, app.id);
    const index = Math.min(input.position ?? targetIds.length, targetIds.length);
    targetIds.splice(index, 0, app.id);

    tx.update(applications)
      .set({ columnId: input.columnId, updatedAt: new Date() })
      .where(eq(applications.id, app.id))
      .run();
    writePositions(tx, targetIds);

    if (app.columnId !== input.columnId) {
      writePositions(tx, orderedIds(tx, app.columnId));
      tx.insert(statusHistory)
        .values({ applicationId: app.id, fromColumnId: app.columnId, toColumnId: input.columnId })
        .run();
    }

    const moved = tx.select().from(applications).where(eq(applications.id, app.id)).get();
    if (!moved) throw notFound("Candidature");
    return moved;
  });
}
