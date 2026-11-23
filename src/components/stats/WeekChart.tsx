function formatWeek(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Vertical bars, one per week; each bar carries its value and week as text. */
export function WeekChart({ weeks }: { weeks: { weekStart: string; count: number }[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.count));

  return (
    <ol className="flex h-48 items-end gap-2">
      {weeks.map((w) => (
        <li
          key={w.weekStart}
          className="flex h-full flex-1 flex-col items-center justify-end gap-1"
          aria-label={`Semaine du ${formatWeek(w.weekStart)} : ${w.count} candidature${
            w.count > 1 ? "s" : ""
          }`}
        >
          <span className="text-sm font-medium" aria-hidden="true">
            {w.count}
          </span>
          <span
            className="bg-accent w-full rounded-t-md"
            style={{
              height: `${Math.max(4, (w.count / max) * 100)}%`,
              opacity: w.count ? 1 : 0.35,
            }}
            aria-hidden="true"
          />
          <span className="text-muted text-xs" aria-hidden="true">
            {formatWeek(w.weekStart)}
          </span>
        </li>
      ))}
    </ol>
  );
}
