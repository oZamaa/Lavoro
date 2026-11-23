import type { HistoryEntry } from "@/lib/application-types";
import type { BoardColumn } from "@/lib/board";

function describe(entry: HistoryEntry, name: (id: number | null) => string): string {
  if (entry.fromColumnId === null) return `Créée dans « ${name(entry.toColumnId)} »`;
  return `Déplacée de « ${name(entry.fromColumnId)} » vers « ${name(entry.toColumnId)} »`;
}

export function CardHistory({
  history,
  columns,
}: {
  history: HistoryEntry[];
  columns: BoardColumn[];
}) {
  const name = (id: number | null) => columns.find((c) => c.id === id)?.name ?? "colonne supprimée";

  return (
    <section aria-labelledby="history-title" className="border-border border-t px-6 py-4">
      <h3
        id="history-title"
        className="text-muted mb-3 text-xs font-semibold tracking-wide uppercase"
      >
        Historique
      </h3>
      <ol className="border-border flex flex-col gap-3 border-l pl-4">
        {history.map((entry) => (
          <li key={entry.id}>
            <p className="text-sm font-medium">{describe(entry, name)}</p>
            <p className="text-muted text-xs">
              {new Date(entry.changedAt).toLocaleString("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
