import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="hidden w-60 shrink-0 flex-col gap-8 p-6 md:flex">
        <div className="flex items-center gap-3">
          <span
            className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-full font-bold"
            aria-hidden="true"
          >
            J
          </span>
          <span className="text-lg font-semibold">JobTrack</span>
        </div>
        <nav aria-label="Navigation principale">
          <Link
            href="/"
            aria-current="page"
            className="rounded-button bg-accent/20 flex items-center px-3 py-2 font-medium"
          >
            Kanban
          </Link>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col p-6 md:pl-0">
        <div className="flex justify-end pb-2">
          <ThemeToggle />
        </div>
        {children}
      </div>
    </div>
  );
}
