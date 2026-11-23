import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import { applications, columns, statusHistory } from "@/db/schema";
import { DEFAULT_COLUMNS } from "@/db/seed";

describe("database", () => {
  it("applies migrations and seeds the default columns in order", () => {
    const db = createDatabase(":memory:");
    const rows = db.select().from(columns).orderBy(columns.position).all();
    expect(rows.map((c) => c.name)).toEqual([...DEFAULT_COLUMNS]);
  });

  it("stores an application and cascades history on delete", () => {
    const db = createDatabase(":memory:");
    const first = db.select().from(columns).orderBy(columns.position).get();
    if (!first) throw new Error("seed missing");
    const app = db
      .insert(applications)
      .values({
        company: "Société Alpha",
        title: "Développeur web",
        columnId: first.id,
        position: 0,
      })
      .returning()
      .get();
    db.insert(statusHistory).values({ applicationId: app.id, toColumnId: first.id }).run();

    db.delete(applications).where(eq(applications.id, app.id)).run();
    expect(db.select().from(statusHistory).all()).toHaveLength(0);
  });

  it("refuses to delete a column that still has applications", () => {
    const db = createDatabase(":memory:");
    const first = db.select().from(columns).get();
    if (!first) throw new Error("seed missing");
    db.insert(applications)
      .values({ company: "A", title: "B", columnId: first.id, position: 0 })
      .run();
    expect(() => db.delete(columns).where(eq(columns.id, first.id)).run()).toThrow();
  });
});
