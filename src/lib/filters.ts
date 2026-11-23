import type { BoardCard } from "@/lib/board";
import { normalizeText } from "@/lib/text";

export type SortKey = "manual" | "applied" | "company" | "followUp";

export type Filters = {
  query: string;
  city: string;
  contract: string;
  source: string;
  sort: SortKey;
};

export const EMPTY_FILTERS: Filters = {
  query: "",
  city: "",
  contract: "",
  source: "",
  sort: "manual",
};

export const SORT_LABELS: Record<SortKey, string> = {
  manual: "Ordre manuel",
  applied: "Candidature récente",
  company: "Entreprise (A → Z)",
  followUp: "Prochaine relance",
};

/** True when a search or a filter narrows the list (sorting alone does not count). */
export function isFiltering(f: Filters): boolean {
  return f.query.trim() !== "" || f.city !== "" || f.contract !== "" || f.source !== "";
}

/** Manual drag & drop only makes sense on the unfiltered, manually ordered board. */
export function isCustomView(f: Filters): boolean {
  return isFiltering(f) || f.sort !== "manual";
}

export function matches(card: BoardCard, f: Filters): boolean {
  if (f.city && normalizeText(card.city ?? "") !== normalizeText(f.city)) return false;
  if (f.contract && normalizeText(card.contract ?? "") !== normalizeText(f.contract)) return false;
  if (f.source && normalizeText(card.source ?? "") !== normalizeText(f.source)) return false;

  const tokens = normalizeText(f.query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = normalizeText(
    [card.company, card.title, card.city, card.contract, card.source].filter(Boolean).join(" "),
  );
  return tokens.every((t) => haystack.includes(t));
}

/** Compares nullable ISO dates; null always goes last. */
function compareDates(a: string | null, b: string | null, direction: 1 | -1): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -direction : direction;
}

export function sortCards(cards: BoardCard[], sort: SortKey): BoardCard[] {
  if (sort === "manual") return cards;
  const copy = [...cards];
  if (sort === "applied") copy.sort((a, b) => compareDates(a.appliedAt, b.appliedAt, -1));
  if (sort === "followUp") copy.sort((a, b) => compareDates(a.followUpAt, b.followUpAt, 1));
  if (sort === "company") copy.sort((a, b) => a.company.localeCompare(b.company, "fr"));
  return copy;
}

export function applyFilters(cards: BoardCard[], f: Filters): BoardCard[] {
  return sortCards(
    cards.filter((c) => matches(c, f)),
    f.sort,
  );
}

/** Distinct non-empty values of a field (case/accent-insensitive), sorted for a select. */
export function distinctValues(cards: BoardCard[], key: "city" | "contract" | "source"): string[] {
  const seen = new Map<string, string>();
  for (const card of cards) {
    const value = card[key]?.trim();
    if (value && !seen.has(normalizeText(value))) seen.set(normalizeText(value), value);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "fr"));
}
