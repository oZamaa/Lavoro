import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db/client";
import { AppShell } from "@/components/layout/AppShell";
import { BarList } from "@/components/stats/BarList";
import { StatCard } from "@/components/stats/StatCard";
import { WeekChart } from "@/components/stats/WeekChart";
import { listApplications } from "@/lib/applications";
import { listColumns } from "@/lib/columns";
import { localToday } from "@/lib/followup";
import { computeStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Statistiques · JobTrack" };

// Reads the database on every request (never prerendered at build time).
export const dynamic = "force-dynamic";

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default function StatsPage() {
  const db = getDb();
  const columns = listColumns(db);
  const stats = computeStats(columns, listApplications(db), localToday());

  return (
    <AppShell>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <h1 className="text-2xl font-semibold tracking-tight">Statistiques</h1>
        <p className="text-muted mt-1 mb-6 text-sm">Un aperçu de ta recherche en cours.</p>

        {stats.total === 0 && (
          <p className="rounded-card border-border text-muted mb-4 border border-dashed p-4 text-sm">
            Pas encore de données.{" "}
            <Link href="/" className="text-foreground font-medium underline">
              Ajoute une candidature
            </Link>{" "}
            pour voir apparaître les statistiques.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Candidatures" value={stats.total} />
          <StatCard label="Cette semaine" value={stats.thisWeek} hint="depuis lundi" />
          <StatCard
            label="À relancer"
            value={stats.overdue}
            hint="date de relance atteinte"
            highlight={stats.overdue > 0}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-card border-border bg-card border p-4">
            <h2 className="mb-4 text-base font-semibold">Par statut</h2>
            <BarList items={stats.byColumn.map((c) => ({ label: c.name, count: c.count }))} />
          </section>

          <section className="rounded-card border-border bg-card border p-4">
            <h2 className="mb-4 text-base font-semibold">Candidatures par semaine</h2>
            <WeekChart weeks={stats.perWeek} />
          </section>
        </div>

        <section className="rounded-card border-border bg-card mt-4 border p-4">
          <h2 className="mb-4 text-base font-semibold">Prochaines relances</h2>
          {stats.upcoming.length === 0 ? (
            <p className="text-muted text-sm">Aucune relance planifiée.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {stats.upcoming.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.company}</p>
                    <p className="text-muted truncate text-sm">{u.title}</p>
                  </div>
                  <p
                    className={`shrink-0 text-sm ${u.overdue ? "text-danger-text font-medium" : "text-muted"}`}
                  >
                    {u.overdue ? "À relancer · " : ""}
                    {formatDay(u.followUpAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
