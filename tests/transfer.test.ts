import { beforeEach, describe, expect, it } from "vitest";
import { createDatabase, type AppDatabase } from "@/db/client";
import {
  createApplication,
  getApplication,
  listApplications,
  moveApplication,
} from "@/lib/applications";
import { listColumns } from "@/lib/columns";
import { HttpError } from "@/lib/http";
import {
  buildExport,
  exportToCsv,
  exportToJson,
  parseImportContent,
  runImport,
} from "@/lib/transfer";

let db: AppDatabase;

beforeEach(() => {
  db = createDatabase(":memory:");
});

function seed(target: AppDatabase) {
  const cols = listColumns(target);
  const interview = cols[2];
  if (!interview) throw new Error("seed missing");
  const a = createApplication(target, {
    company: "Société Alpha",
    title: 'Dev "senior"',
    city: "Paris",
    contract: "CDI",
    remote: "hybrid",
    appliedAt: "2026-11-12",
    notes: "ligne 1\nligne 2, avec virgule",
    contactEmail: "rh@alpha.io",
  });
  createApplication(target, { company: "=HYPERLINK(1)", title: "Piège" });
  moveApplication(target, a.id, { columnId: interview.id });
  return a;
}

const importAll = (
  target: AppDatabase,
  format: "csv" | "json",
  content: string,
  mode: "append" | "replace" = "append",
) => runImport(target, parseImportContent(format, content), mode);

describe("export / import", () => {
  it("round-trips through JSON, keeping fields, order, dates and history", () => {
    seed(db);
    const json = exportToJson(buildExport(db));

    const fresh = createDatabase(":memory:");
    const result = importAll(fresh, "json", json);
    expect(result.imported).toBe(2);

    const apps = listApplications(fresh);
    const alpha = apps.find((x) => x.company === "Société Alpha");
    if (!alpha) throw new Error("missing");
    expect(alpha).toMatchObject({
      title: 'Dev "senior"',
      city: "Paris",
      remote: "hybrid",
      appliedAt: "2026-11-12",
      notes: "ligne 1\nligne 2, avec virgule",
    });
    const detail = getApplication(fresh, alpha.id);
    expect(detail.history).toHaveLength(2);
    expect(detail.history[0]).toMatchObject({ toColumnId: alpha.columnId });
    const original = listApplications(db).find((x) => x.company === "Société Alpha");
    expect(alpha.createdAt.getTime()).toBe(original?.createdAt.getTime());
  });

  it("round-trips through CSV, including formula-looking values", () => {
    seed(db);
    const csv = exportToCsv(buildExport(db));
    expect(csv).toContain("'=HYPERLINK(1)");

    const fresh = createDatabase(":memory:");
    importAll(fresh, "csv", csv);
    const companies = listApplications(fresh)
      .map((a) => a.company)
      .sort();
    expect(companies).toEqual(["=HYPERLINK(1)", "Société Alpha"]);
    const alpha = listApplications(fresh).find((a) => a.company === "Société Alpha");
    expect(alpha?.notes).toBe("ligne 1\nligne 2, avec virgule");
    const names = new Map(listColumns(fresh).map((c) => [c.id, c.name]));
    expect(names.get(alpha?.columnId ?? 0)).toBe("Entretien");
  });

  it("appends by default", () => {
    seed(db);
    const json = exportToJson(buildExport(db));
    expect(importAll(db, "json", json).deleted).toBe(0);
    expect(listApplications(db)).toHaveLength(4);
  });

  it("replace removes existing applications first", () => {
    seed(db);
    const json = exportToJson(buildExport(db));
    const result = runImport(db, parseImportContent("json", json), "replace");
    expect(result.deleted).toBe(2);
    expect(listApplications(db)).toHaveLength(2);
  });

  it("refuses unknown columns, with line numbers and a suggestion, and changes nothing", () => {
    seed(db);
    const before = listApplications(db).length;
    const csv = [
      "column,company,title",
      "Deja,A,x",
      "Entretien,B,y",
      "Deja,C,z",
      "Offre ,D,w",
      "",
    ].join("\n");
    try {
      importAll(db, "csv", csv, "replace");
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      const message = (e as HttpError).message;
      expect(message).toContain("« Deja » (lignes 2, 4)");
      expect(message).toContain("voulais-tu dire « Deja postule » ?");
      expect(message).toContain("Colonnes existantes");
    }
    // Not even the deletion of "replace" mode happened, and no column was created.
    expect(listApplications(db)).toHaveLength(before);
    expect(listColumns(db)).toHaveLength(6);
  });

  it("never creates columns, even ones declared in a JSON export", () => {
    const json = JSON.stringify({
      columns: [{ name: "Relance" }],
      applications: [{ column: "Relance", company: "A", title: "x" }],
    });
    expect(() => importAll(db, "json", json)).toThrow(HttpError);
    expect(listColumns(db)).toHaveLength(6);
  });

  it("matches columns without accents/case; rows without a column go to the first one", () => {
    const csv = ["column,company,title", "à POSTULER,A,x", "ENTRETIEN,B,y", ",C,z", ""].join(
      "\r\n",
    );
    importAll(db, "csv", csv);
    const cols = listColumns(db);
    expect(cols).toHaveLength(6);
    const byCompany = new Map(listApplications(db).map((a) => [a.company, a.columnId]));
    expect(byCompany.get("A")).toBe(cols[0]?.id);
    expect(byCompany.get("C")).toBe(cols[0]?.id);
    expect(byCompany.get("B")).toBe(cols[2]?.id);
  });

  it("accepts ; separated CSV and a bare JSON array", () => {
    expect(importAll(db, "csv", "company;title;city\nA;x;Paris\n").imported).toBe(1);
    expect(importAll(db, "json", JSON.stringify([{ company: "B", title: "y" }])).imported).toBe(1);
  });

  it("appends positions after existing cards in the same column", () => {
    seed(db);
    importAll(db, "csv", "column,company,title\nEntretien,Z,z\n");
    const entretien = listColumns(db)[2];
    const positions = listApplications(db)
      .filter((a) => a.columnId === entretien?.id)
      .map((a) => a.position)
      .sort();
    expect(positions).toEqual([0, 1]);
  });

  it("rejects invalid files without importing anything", () => {
    const bad = "company,title,url\nA,x,https://ok.io\nB,y,javascript:alert(1)\n,z,\n";
    try {
      parseImportContent("csv", bad);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).message).toContain("ligne 3");
      expect((e as HttpError).message).toContain("ligne 4");
      expect((e as HttpError).status).toBe(400);
    }
    expect(() => parseImportContent("csv", "foo,bar\n1,2\n")).toThrow(HttpError);
    expect(() => parseImportContent("csv", "company,title\n")).toThrow(HttpError);
    expect(() => parseImportContent("json", "{nope")).toThrow(HttpError);
    expect(() => parseImportContent("json", '{"hello":1}')).toThrow(HttpError);
    expect(listApplications(db)).toHaveLength(0);
  });

  it("is atomic: a failure mid-import leaves the database untouched", () => {
    seed(db);
    const before = listApplications(db).length;
    const parsed = parseImportContent("json", JSON.stringify([{ company: "A", title: "b" }]));
    // Force a failure inside the transaction by corrupting a row after validation.
    const broken = {
      ...parsed,
      rows: [
        ...parsed.rows,
        { company: "X", title: "Y", history: [{ from: null, to: null, changedAt: "not a date" }] },
      ],
    };
    expect(() => runImport(db, broken, "append")).toThrow();
    expect(listApplications(db)).toHaveLength(before);
  });
});
