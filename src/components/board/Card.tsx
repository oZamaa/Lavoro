import type { ReactNode } from "react";
import type { BoardCard } from "@/lib/board";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

const pill = "rounded-md border border-border px-1.5 py-0.5 text-xs text-muted";

/** Presentational card (also used inside the drag overlay). */
export function Card({
  card,
  dragging = false,
  overdue = false,
  onOpen,
  handle,
}: {
  card: BoardCard;
  dragging?: boolean;
  overdue?: boolean;
  onOpen?: () => void;
  /** Drag handle (keyboard entry point), rendered next to the company name. */
  handle?: ReactNode;
}) {
  return (
    <article
      onClick={onOpen}
      className={`rounded-card border-border bg-card hover:border-input border p-3.5 transition-colors duration-150 ${
        dragging ? "border-foreground/40" : ""
      } ${onOpen ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm leading-snug font-semibold break-words">
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
        {handle}
      </div>
      <p className="text-muted text-sm break-words">{card.title}</p>
      {(card.city || card.contract || overdue) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {overdue && (
            <span className="bg-primary text-primary-foreground rounded-md px-1.5 py-0.5 text-xs font-medium">
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
