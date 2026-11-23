import { describe, expect, it } from "vitest";
import { computeStats, weekStart, type StatsApplication } from "@/lib/stats";

const columns = [
  { id: 1, name: "A postuler" },
  { id: 2, name: "Entretien" },
  { id: 3, name: "Refuse" },
];

const app = (id: number, over: Partial<StatsApplication> = {}): StatsApplication => ({
  id,
  company: `C${id}`,
  title: "Dev",
  columnId: 1,
  appliedAt: null,
  followUpAt: null,
  createdAt: new Date("2026-11-01T10:00:00Z"),
  ...over,
});

describe("weekStart", () => {
  it("returns the Monday of the week", () => {
    expect(weekStart("2026-11-23")).toBe("2026-11-23"); // Monday
    expect(weekStart("2026-11-29")).toBe("2026-11-23"); // Sunday
    expect(weekStart("2026-11-22")).toBe("2026-11-16");
  });
});

describe("computeStats", () => {
  const today = "2026-11-23";
  const apps = [
    app(1, { appliedAt: "2026-11-23" }),
    app(2, { appliedAt: "2026-11-17", columnId: 2, followUpAt: "2026-11-20" }),
    app(3, { appliedAt: "2026-11-10", columnId: 3, followUpAt: "2026-11-01" }),
    app(4, { appliedAt: null, createdAt: new Date("2026-11-24T08:00:00Z") }),
    app(5, { appliedAt: "2025-01-01" }),
  ];
  const stats = computeStats(columns, apps, today);

  it("counts totals and per column", () => {
    expect(stats.total).toBe(5);
    expect(stats.byColumn.map((c) => c.count)).toEqual([3, 1, 1]);
  });

  it("buckets applications by week, ignoring those outside the window", () => {
    expect(stats.perWeek).toHaveLength(8);
    expect(stats.perWeek[7]).toEqual({ weekStart: "2026-11-23", count: 2 });
    expect(stats.perWeek[6]).toEqual({ weekStart: "2026-11-16", count: 1 });
    expect(stats.perWeek[5]).toEqual({ weekStart: "2026-11-09", count: 1 });
    expect(stats.thisWeek).toBe(2);
  });

  it("counts overdue follow-ups, excluding closed columns", () => {
    expect(stats.overdue).toBe(1);
    expect(stats.upcoming.map((u) => u.id)).toEqual([2]);
    expect(stats.upcoming[0]?.overdue).toBe(true);
  });
});
