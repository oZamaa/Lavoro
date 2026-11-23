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
    appliedAt: a.appliedAt,
  }));

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col">
        <h1 className="text-3xl font-semibold">Mes candidatures</h1>
        <p className="text-muted mt-1 mb-5 text-sm">
          {cards.length} candidature{cards.length > 1 ? "s" : ""} · glisse une carte pour changer
          son statut
        </p>
        <Board columns={columns} initialCards={cards} />
      </div>
    </AppShell>
  );
}
