import type { BoardCard } from "@/lib/board";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

const pill = "rounded-full bg-accent/15 px-2 py-0.5 text-xs text-foreground";

/** Presentational card (also used inside the drag overlay). */
export function Card({
  card,
  dragging = false,
  overdue = false,
  onOpen,
}: {
  card: BoardCard;
  dragging?: boolean;
  overdue?: boolean;
  onOpen?: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className={`rounded-card border-border bg-card shadow-card border p-4 ${
        dragging ? "ring-foreground/20 ring-2" : ""
      } ${onOpen ? "cursor-pointer" : ""}`}
    >
      <h3 className="leading-snug font-bold break-words">
        {onOpen ? (
          // Keyboard entry point: Enter/Space on this button bubbles a click to the article.
          <button
            type="button"
            aria-label={`Ouvrir la candidature ${card.company}`}
            className="rounded-sm text-left"
          >
            {card.company}
          </button>
        ) : (
          card.company
        )}
      </h3>
      <p className="text-muted text-sm break-words">{card.title}</p>
      {(card.city || card.contract || overdue) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {overdue && (
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
              À relancer
            </span>
          )}
          {card.city && <span className={pill}>{card.city}</span>}
          {card.contract && <span className={pill}>{card.contract}</span>}
        </div>
      )}
      {card.appliedAt && (
        <p className="text-muted mt-2 text-xs">Postulé le {formatDate(card.appliedAt)}</p>
      )}
      {card.followUpAt && (
        <p className="text-muted text-xs">Relance le {formatDate(card.followUpAt)}</p>
      )}
    </article>
  );
}
