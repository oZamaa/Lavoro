import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">JobTrack</h1>
        <ThemeToggle />
      </header>
      <section className="rounded-column bg-column p-4">
        <article className="rounded-card bg-card shadow-card border-border border p-4">
          <p className="font-bold">Société Alpha</p>
          <p className="text-muted">Développeur web</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="bg-accent/15 text-foreground rounded-full px-2 py-0.5 text-sm">
              Paris
            </span>
            <button
              type="button"
              className="rounded-button bg-primary text-primary-foreground px-4 py-2 text-sm transition-opacity duration-150 hover:opacity-90"
            >
              Bouton primaire
            </button>
            <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-sm">
              Offre
            </span>
          </div>
        </article>
      </section>
    </main>
  );
}
