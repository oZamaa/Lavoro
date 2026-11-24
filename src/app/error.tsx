"use client";

import { primaryButtonClass } from "@/components/ui/field-styles";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Une erreur est survenue</h1>
      <p className="text-muted text-sm">
        Impossible d&apos;afficher cette page. Tes données ne sont pas perdues : réessaie, ou
        consulte les journaux avec <code>docker compose logs app</code>.
      </p>
      <button type="button" onClick={reset} className={primaryButtonClass}>
        Réessayer
      </button>
    </main>
  );
}
