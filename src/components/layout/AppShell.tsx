import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SidebarNav } from "./SidebarNav";

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
        <SidebarNav orientation="vertical" />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col p-6 md:pl-0">
        <div className="flex items-center justify-between pb-2">
          <div className="md:hidden">
            <SidebarNav orientation="horizontal" />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
