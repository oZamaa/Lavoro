import { asc, count, max } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { applications, columns, statusHistory } from "@/db/schema";
import { FORM_FIELDS } from "@/lib/application-types";
import { guardFormula, parseCsv, toCsv, unguardFormula } from "@/lib/csv";
import { HttpError } from "@/lib/http";
import { normalizeText } from "@/lib/text";
import { importRowSchema, type ImportRow } from "@/lib/validators";

const MAX_ROWS = 5000;

/* ------------------------------------------------------------------ export */

export type ExportApplication = {
  column: string;
  createdAt: string;
  updatedAt: string;
  history: { from: string | null; to: string | null; changedAt: string }[];
} & Record<(typeof FORM_FIELDS)[number], string | null>;

export type ExportBundle = {
  app: "jobtrack";
  version: 1;
  exportedAt: string;
  columns: { name: string; position: number }[];
  applications: ExportApplication[];
};

export function buildExport(db: AppDatabase, now: Date = new Date()): ExportBundle {
  const cols = db.select().from(columns).orderBy(asc(columns.position), asc(columns.id)).all();
  const colInfo = new Map(cols.map((c, index) => [c.id, { name: c.name, order: index }]));
  const nameOf = (id: number | null) => (id === null ? null : (colInfo.get(id)?.name ?? null));

  const historyByApp = new Map<number, ExportApplication["history"]>();
  const history = db
    .select()
    .from(statusHistory)
    .orderBy(asc(statusHistory.changedAt), asc(statusHistory.id))
    .all();
  for (const h of history) {
    const list = historyByApp.get(h.applicationId) ?? [];
    list.push({
      from: nameOf(h.fromColumnId),
      to: nameOf(h.toColumnId),
      changedAt: h.changedAt.toISOString(),
    });
    historyByApp.set(h.applicationId, list);
  }

  const apps = db
    .select()
    .from(applications)
    .all()
    .sort(
      (a, b) =>
        (colInfo.get(a.columnId)?.order ?? 0) - (colInfo.get(b.columnId)?.order ?? 0) ||
        a.position - b.position ||
        a.id - b.id,
    );

  return {
    app: "jobtrack",
    version: 1,
    exportedAt: now.toISOString(),
    columns: cols.map((c) => ({ name: c.name, position: c.position })),
    applications: apps.map((a) => ({
      column: nameOf(a.columnId) ?? "",
      company: a.company,
      title: a.title,
      city: a.city,
      url: a.url,
      source: a.source,
      contract: a.contract,
      remote: a.remote,
      salary: a.salary,
      appliedAt: a.appliedAt,
      followUpAt: a.followUpAt,
      notes: a.notes,
      contactName: a.contactName,
      contactEmail: a.contactEmail,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      history: historyByApp.get(a.id) ?? [],
    })),
  };
}

export function exportToJson(bundle: ExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function exportToCsv(bundle: ExportBundle): string {
  const header = ["column", ...FORM_FIELDS];
  const rows = bundle.applications.map((a) => [
    guardFormula(a.column),
    ...FORM_FIELDS.map((f) => guardFormula(a[f] ?? "")),
  ]);
  return toCsv([header, ...rows]);
}

/* ------------------------------------------------------------------ import */

export type ParsedImport = {
  rows: ImportRow[];
  /** File line number of the first row (2 for CSV because of the header), for error messages. */
  firstLine: number;
};
export type ImportMode = "append" | "replace";
export type ImportResult = { imported: number; deleted: number };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function validateRows(items: unknown[], lineOf: (index: number) => number): ImportRow[] {
  if (items.length > MAX_ROWS) {
    throw new HttpError(400, `Import limité à ${MAX_ROWS} candidatures`);
  }
  const rows: ImportRow[] = [];
  const problems: string[] = [];
  items.forEach((item, index) => {
    const parsed = importRowSchema.safeParse(item);
    if (parsed.success) {
      rows.push(parsed.data);
    } else {
      const details = parsed.error.issues
        .map((i) => `${i.path.join(".") || "ligne"} : ${i.message}`)
        .join(", ");
      problems.push(`ligne ${lineOf(index)} (${details})`);
    }
  });
  if (problems.length > 0) {
    const shown = problems.slice(0, 10).join(" ; ");
    const more = problems.length > 10 ? ` … et ${problems.length - 10} autres` : "";
    throw new HttpError(400, `Import annulé, données invalides : ${shown}${more}`);
  }
  if (rows.length === 0) throw new HttpError(400, "Aucune candidature à importer");
  return rows;
}

function parseJsonImport(content: string): ParsedImport {
  let data: unknown;
  try {
    data = JSON.parse(content.charCodeAt(0) === 0xfeff ? content.slice(1) : content);
  } catch {
    throw new HttpError(400, "Fichier JSON invalide");
  }

  let items: unknown[];
  if (Array.isArray(data)) {
    items = data;
  } else if (isRecord(data) && Array.isArray(data.applications)) {
    items = data.applications;
  } else {
    throw new HttpError(400, "Format JSON non reconnu (attendu : une liste ou un export JobTrack)");
  }
  return { rows: validateRows(items, (i) => i + 1), firstLine: 1 };
}

const CSV_KEYS = new Map(["column", ...FORM_FIELDS].map((k) => [k.toLowerCase(), k]));

function parseCsvImport(content: string): ParsedImport {
  let table: string[][];
  try {
    table = parseCsv(content);
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : "Fichier CSV invalide");
  }
  const [header, ...body] = table;
  if (!header) throw new HttpError(400, "Fichier CSV vide");

  const keys = header.map((h) => CSV_KEYS.get(h.trim().toLowerCase()));
  if (!keys.includes("company") || !keys.includes("title")) {
    throw new HttpError(400, "Colonnes obligatoires manquantes dans le CSV : company, title");
  }

  const items = body.map((cells) => {
    const item: Record<string, string> = {};
    keys.forEach((key, i) => {
      if (key) item[key] = unguardFormula(cells[i] ?? "");
    });
    return item;
  });
  // Line 1 is the header, so the first data row is line 2.
  return { rows: validateRows(items, (i) => i + 2), firstLine: 2 };
}

export function parseImportContent(format: "csv" | "json", content: string): ParsedImport {
  return format === "json" ? parseJsonImport(content) : parseCsvImport(content);
}

/**
 * Rows may only use columns that already exist (matched without accents or case).
 * Anything else is refused, with the line numbers and a suggestion, before any write.
 */
function checkColumns(existingNames: string[], parsed: ParsedImport): void {
  const known = new Set(existingNames.map(normalizeText));
  const unknown = new Map<string, { label: string; lines: number[] }>();
  parsed.rows.forEach((row, index) => {
    const name = row.column?.trim();
    if (!name || known.has(normalizeText(name))) return;
    const entry = unknown.get(normalizeText(name)) ?? { label: name, lines: [] };
    entry.lines.push(parsed.firstLine + index);
    unknown.set(normalizeText(name), entry);
  });
  if (unknown.size === 0) return;

  const describeUnknown = ([key, { label, lines }]: [
    string,
    { label: string; lines: number[] },
  ]) => {
    const where = `ligne${lines.length > 1 ? "s" : ""} ${lines.slice(0, 5).join(", ")}${lines.length > 5 ? "…" : ""}`;
    // "Deja" -> "Deja postule": suggest the only existing column that starts with the typed name.
    const near = existingNames.filter((n) => normalizeText(n).startsWith(key));
    const hint = near.length === 1 ? ` — voulais-tu dire « ${near[0]} » ?` : "";
    return `« ${label} » (${where})${hint}`;
  };
  const list = [...unknown.entries()].map(describeUnknown).join(" ; ");
  const plural = unknown.size > 1 ? "s" : "";
  throw new HttpError(
    400,
    `Import annulé : colonne${plural} inconnue${plural} : ${list}${list.endsWith("?") ? "" : "."} ` +
      `Colonnes existantes : ${existingNames.join(", ")}. Corrige le fichier puis réessaie.`,
  );
}

/** Imports validated rows in one transaction (all or nothing). Never creates columns. */
export function runImport(db: AppDatabase, parsed: ParsedImport, mode: ImportMode): ImportResult {
  return db.transaction((tx) => {
    const existing = tx
      .select()
      .from(columns)
      .orderBy(asc(columns.position), asc(columns.id))
      .all();
    const firstColumn = existing[0];
    if (!firstColumn) throw new HttpError(409, "Aucune colonne disponible");
    // Validate before touching anything (a replace would otherwise delete first).
    checkColumns(
      existing.map((c) => c.name),
      parsed,
    );

    let deleted = 0;
    if (mode === "replace") {
      deleted = tx.select({ total: count() }).from(applications).get()?.total ?? 0;
      tx.delete(applications).run(); // status_history rows cascade
    }

    const idByName = new Map(existing.map((c) => [normalizeText(c.name), c.id]));
    const nextPosition = new Map<number, number>();
    const tops = tx
      .select({ columnId: applications.columnId, top: max(applications.position) })
      .from(applications)
      .groupBy(applications.columnId)
      .all();
    for (const t of tops) nextPosition.set(t.columnId, (t.top ?? -1) + 1);

    for (const row of parsed.rows) {
      const { column, history, createdAt, updatedAt, ...fields } = row;
      const columnId = column
        ? (idByName.get(normalizeText(column)) ?? firstColumn.id)
        : firstColumn.id;
      const position = nextPosition.get(columnId) ?? 0;
      nextPosition.set(columnId, position + 1);

      const created = createdAt ? new Date(createdAt) : new Date();
      const inserted = tx
        .insert(applications)
        .values({
          ...fields,
          columnId,
          position,
          createdAt: created,
          updatedAt: updatedAt ? new Date(updatedAt) : created,
        })
        .returning({ id: applications.id })
        .get();

      const entries =
        history && history.length > 0
          ? history.map((h) => ({
              fromColumnId: h.from ? (idByName.get(normalizeText(h.from)) ?? null) : null,
              toColumnId: h.to ? (idByName.get(normalizeText(h.to)) ?? null) : null,
              changedAt: new Date(h.changedAt),
            }))
          : [{ fromColumnId: null, toColumnId: columnId, changedAt: created }];
      for (const entry of entries) {
        tx.insert(statusHistory)
          .values({ applicationId: inserted.id, ...entry })
          .run();
      }
    }

    return { imported: parsed.rows.length, deleted };
  });
}
