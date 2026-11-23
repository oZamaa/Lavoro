import { count } from "drizzle-orm";
import type { AppDatabase } from "./client";
import { columns } from "./schema";

/** Deliberately accent-free (see migration 0001). */
export const DEFAULT_COLUMNS = [
  "A postuler",
  "Deja postule",
  "Entretien",
  "Offre",
  "Refuse",
  "Archive",
] as const;

/** Inserts the default Kanban columns, only if the table is empty. */
export function seedDefaultColumns(db: AppDatabase): void {
  const row = db.select({ total: count() }).from(columns).get();
  if (row && row.total > 0) return;
  db.insert(columns)
    .values(DEFAULT_COLUMNS.map((name, position) => ({ name, position })))
    .run();
}
