import { getDb } from "@/db/client";
import { Board } from "@/components/board/Board";
import { AppShell } from "@/components/layout/AppShell";
import { listApplications } from "@/lib/applications";
import { listColumns } from "@/lib/columns";

// Reads the database on every request (never prerendered at build time).
export const dynamic = "force-dynamic";

export default function HomePage() {
  const db = getDb();
  const columns = listColumns(db).map(({ id, name }) => ({ id, name }));
  const cards = listApplications(db).map((a) => ({
    id: a.id,
    columnId: a.columnId,
    company: a.company,
    title: a.title,
    city: a.city,
    contract: a.contract,
    source: a.source,
    appliedAt: a.appliedAt,
    followUpAt: a.followUpAt,
  }));

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <h1 className="text-3xl font-semibold">Mes candidatures</h1>
        <p className="text-muted mt-1 mb-5 text-sm">
          Glisse une carte pour changer son statut, clique dessus pour la modifier.
        </p>
        <Board columns={columns} initialCards={cards} />
      </div>
    </AppShell>
  );
}
