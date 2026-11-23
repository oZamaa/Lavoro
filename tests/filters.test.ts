import { describe, expect, it } from "vitest";
import type { BoardCard } from "@/lib/board";
import {
  EMPTY_FILTERS,
  applyFilters,
  distinctValues,
  isCustomView,
  isFiltering,
  type Filters,
} from "@/lib/filters";
import { isClosedColumn, isOverdue, localToday } from "@/lib/followup";

const card = (id: number, over: Partial<BoardCard> = {}): BoardCard => ({
  id,
  company: `Company ${id}`,
  title: "Développeur",
  city: null,
  contract: null,
  source: null,
  appliedAt: null,
  followUpAt: null,
  ...over,
});

const cards = [
  card(1, {
    company: "Société Alpha",
    city: "Paris",
    contract: "CDI",
    source: "LinkedIn",
    appliedAt: "2026-11-10",
  }),
  card(2, {
    company: "Beta",
    city: "Lyon",
    contract: "CDD",
    source: "Indeed",
    appliedAt: "2026-11-15",
    followUpAt: "2026-11-20",
  }),
  card(3, {
    company: "Gamma",
    city: "paris",
    contract: "CDI",
    appliedAt: null,
    followUpAt: "2026-11-18",
  }),
];
const f = (over: Partial<Filters>): Filters => ({ ...EMPTY_FILTERS, ...over });
const ids = (list: BoardCard[]) => list.map((c) => c.id);

describe("filters", () => {
  it("returns everything with empty filters", () => {
    expect(ids(applyFilters(cards, EMPTY_FILTERS))).toEqual([1, 2, 3]);
  });

  it("searches accent- and case-insensitively across several fields", () => {
    expect(ids(applyFilters(cards, f({ query: "societe" })))).toEqual([1]);
    expect(ids(applyFilters(cards, f({ query: "LYON indeed" })))).toEqual([2]);
    expect(ids(applyFilters(cards, f({ query: "zzz" })))).toEqual([]);
  });

  it("filters by city, contract and source (ignoring case)", () => {
    expect(ids(applyFilters(cards, f({ city: "Paris" })))).toEqual([1, 3]);
    expect(ids(applyFilters(cards, f({ contract: "CDI", source: "LinkedIn" })))).toEqual([1]);
  });

  it("sorts with nulls last", () => {
    expect(ids(applyFilters(cards, f({ sort: "applied" })))).toEqual([2, 1, 3]);
    expect(ids(applyFilters(cards, f({ sort: "followUp" })))).toEqual([3, 2, 1]);
    expect(ids(applyFilters(cards, f({ sort: "company" })))).toEqual([2, 3, 1]);
  });

  it("detects filtering / custom views", () => {
    expect(isFiltering(EMPTY_FILTERS)).toBe(false);
    expect(isFiltering(f({ query: " " }))).toBe(false);
    expect(isFiltering(f({ city: "Paris" }))).toBe(true);
    expect(isCustomView(f({ sort: "company" }))).toBe(true);
    expect(isCustomView(EMPTY_FILTERS)).toBe(false);
  });

  it("lists distinct values once, sorted", () => {
    expect(distinctValues(cards, "city")).toEqual(["Lyon", "Paris"]);
    expect(distinctValues(cards, "source")).toEqual(["Indeed", "LinkedIn"]);
  });
});

describe("follow-up", () => {
  it("flags overdue cards from the follow-up date, except in closed columns", () => {
    expect(isOverdue("2026-11-20", "2026-11-21", "Entretien")).toBe(true);
    expect(isOverdue("2026-11-21", "2026-11-21", "Entretien")).toBe(true);
    expect(isOverdue("2026-11-22", "2026-11-21", "Entretien")).toBe(false);
    expect(isOverdue(null, "2026-11-21", "Entretien")).toBe(false);
    expect(isOverdue("2026-11-20", null, "Entretien")).toBe(false);
    expect(isOverdue("2026-11-20", "2026-11-21", "Refuse")).toBe(false);
    expect(isOverdue("2026-11-20", "2026-11-21", "Refusé")).toBe(false);
  });

  it("recognises closed columns", () => {
    expect(isClosedColumn("Archive")).toBe(true);
    expect(isClosedColumn("Archivé")).toBe(true);
    expect(isClosedColumn("Offre")).toBe(false);
  });

  it("formats local today", () => {
    expect(localToday(new Date(2026, 10, 3))).toBe("2026-11-03");
  });
});
