import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const REMOTE_VALUES = ["yes", "no", "hybrid"] as const;
export type RemoteValue = (typeof REMOTE_VALUES)[number];

export const columns = sqliteTable("columns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  position: integer("position").notNull(),
});

export const applications = sqliteTable(
  "applications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    company: text("company").notNull(),
    title: text("title").notNull(),
    city: text("city"),
    url: text("url"),
    source: text("source"),
    contract: text("contract"),
    remote: text("remote", { enum: REMOTE_VALUES }),
    salary: text("salary"),
    /** ISO date (YYYY-MM-DD) */
    appliedAt: text("applied_at"),
    /** ISO date (YYYY-MM-DD) */
    followUpAt: text("follow_up_at"),
    notes: text("notes"),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    columnId: integer("column_id")
      .notNull()
      .references(() => columns.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("applications_column_position_idx").on(t.columnId, t.position)],
);

export const statusHistory = sqliteTable(
  "status_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    applicationId: integer("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    /** null = initial creation */
    fromColumnId: integer("from_column_id").references(() => columns.id, {
      onDelete: "set null",
    }),
    toColumnId: integer("to_column_id").references(() => columns.id, { onDelete: "set null" }),
    changedAt: integer("changed_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("status_history_application_idx").on(t.applicationId)],
);

export const columnsRelations = relations(columns, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  column: one(columns, { fields: [applications.columnId], references: [columns.id] }),
  history: many(statusHistory),
}));

export const statusHistoryRelations = relations(statusHistory, ({ one }) => ({
  application: one(applications, {
    fields: [statusHistory.applicationId],
    references: [applications.id],
  }),
}));

export type Column = typeof columns.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type StatusHistoryEntry = typeof statusHistory.$inferSelect;
