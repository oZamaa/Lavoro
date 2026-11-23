import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import { seedDefaultColumns } from "./seed";
import * as schema from "./schema";

export type AppDatabase = BetterSQLite3Database<typeof schema>;
/** Transaction handle passed to `db.transaction(...)` callbacks. */
export type Tx = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];

const MIGRATIONS_FOLDER = path.join(process.cwd(), "src", "db", "migrations");

/** Opens a database, applies pending migrations and seeds default data. */
export function createDatabase(filePath: string): AppDatabase {
  if (filePath !== ":memory:") {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  const sqlite = new Database(filePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  seedDefaultColumns(db);
  return db;
}

const globalForDb = globalThis as unknown as { __jobtrackDb?: AppDatabase };

/** Lazy singleton (survives Next.js hot reload in dev). */
export function getDb(): AppDatabase {
  if (!globalForDb.__jobtrackDb) {
    const filePath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "jobtrack.db");
    globalForDb.__jobtrackDb = createDatabase(filePath);
  }
  return globalForDb.__jobtrackDb;
}
