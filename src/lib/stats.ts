import { isClosedColumn, isOverdue } from "@/lib/followup";

export type StatsApplication = {
  id: number;
  company: string;
  title: string;
  columnId: number;
  appliedAt: string | null;
  followUpAt: string | null;
  createdAt: Date;
};

export type Stats = {
  total: number;
  thisWeek: number;
  overdue: number;
  byColumn: { id: number; name: string; count: number }[];
  /** Oldest first, ends with the current week. */
  perWeek: { weekStart: string; count: number }[];
  upcoming: { id: number; company: string; title: string; followUpAt: string; overdue: boolean }[];
};

const DAY_MS = 86_400_000;

/** Monday (YYYY-MM-DD) of the week containing the given date. */
export function weekStart(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Date an application counts for: the applied date, else the creation date. */
function effectiveDate(a: StatsApplication): string {
  return a.appliedAt ?? a.createdAt.toISOString().slice(0, 10);
}

export function computeStats(
  columns: { id: number; name: string }[],
  applications: StatsApplication[],
  today: string,
  weeks = 8,
): Stats {
  const nameOf = new Map(columns.map((c) => [c.id, c.name]));

  const byColumn = columns.map((c) => ({
    id: c.id,
    name: c.name,
    count: applications.filter((a) => a.columnId === c.id).length,
  }));

  const currentWeek = weekStart(today);
  const perWeek = Array.from({ length: weeks }, (_, i) => ({
    weekStart: addDays(currentWeek, -7 * (weeks - 1 - i)),
    count: 0,
  }));
  for (const a of applications) {
    const bucket = perWeek.find((w) => w.weekStart === weekStart(effectiveDate(a)));
    if (bucket) bucket.count += 1;
  }

  const upcoming = applications
    .filter((a) => a.followUpAt && !isClosedColumn(nameOf.get(a.columnId) ?? ""))
    .sort((a, b) => (a.followUpAt ?? "").localeCompare(b.followUpAt ?? ""))
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      company: a.company,
      title: a.title,
      followUpAt: a.followUpAt ?? "",
      overdue: isOverdue(a.followUpAt, today, nameOf.get(a.columnId) ?? ""),
    }));

  return {
    total: applications.length,
    thisWeek: perWeek[perWeek.length - 1]?.count ?? 0,
    overdue: applications.filter((a) =>
      isOverdue(a.followUpAt, today, nameOf.get(a.columnId) ?? ""),
    ).length,
    byColumn,
    perWeek,
    upcoming,
  };
}
