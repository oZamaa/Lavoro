import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SidebarNav } from "./SidebarNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh">
      <a
        href="#contenu"
        className="rounded-button bg-primary text-primary-foreground sr-only z-[70] px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <aside className="hidden w-60 shrink-0 flex-col gap-8 p-6 md:flex">
        <div className="flex items-center gap-3">
          <span
            className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold"
            aria-hidden="true"
          >
            J
          </span>
          <span className="font-semibold tracking-tight">JobTrack</span>
        </div>
        <SidebarNav orientation="vertical" />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6 md:pl-0">
        <div className="flex items-center justify-between pb-2">
          <div className="md:hidden">
            <SidebarNav orientation="horizontal" />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <main id="contenu" tabIndex={-1} className="flex min-h-0 flex-1 flex-col outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
