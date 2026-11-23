import type { BoardCard } from "@/lib/board";

export type RemoteOption = "yes" | "no" | "hybrid";

export type HistoryEntry = {
  id: number;
  fromColumnId: number | null;
  toColumnId: number | null;
  changedAt: string;
};

/** Application as returned by the API (JSON, dates as strings). */
export type ApplicationDetail = {
  id: number;
  company: string;
  title: string;
  city: string | null;
  url: string | null;
  source: string | null;
  contract: string | null;
  remote: RemoteOption | null;
  salary: string | null;
  appliedAt: string | null;
  followUpAt: string | null;
  notes: string | null;
  contactName: string | null;
  contactEmail: string | null;
  columnId: number;
  position: number;
  createdAt: string;
  updatedAt: string;
  history?: HistoryEntry[];
};

export function toBoardCard(a: ApplicationDetail): BoardCard & { columnId: number } {
  return {
    id: a.id,
    columnId: a.columnId,
    company: a.company,
    title: a.title,
    city: a.city,
    contract: a.contract,
    source: a.source,
    appliedAt: a.appliedAt,
    followUpAt: a.followUpAt,
  };
}

export const FORM_FIELDS = [
  "company",
  "title",
  "city",
  "url",
  "source",
  "contract",
  "remote",
  "salary",
  "appliedAt",
  "followUpAt",
  "contactName",
  "contactEmail",
  "notes",
] as const;

export type FieldName = (typeof FORM_FIELDS)[number];
export type FormValues = Record<FieldName, string> & { columnId: string };

export function toFormValues(
  initial: ApplicationDetail | null,
  defaultColumnId: number,
): FormValues {
  const values = { columnId: String(initial?.columnId ?? defaultColumnId) } as FormValues;
  for (const field of FORM_FIELDS) values[field] = initial?.[field] ?? "";
  return values;
}
