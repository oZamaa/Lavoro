"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Kanban" },
  { href: "/stats", label: "Statistiques" },
];

export function SidebarNav({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className={orientation === "vertical" ? "flex flex-col gap-1" : "flex gap-1"}
    >
      {ITEMS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-button px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              active ? "bg-accent/20" : "hover:bg-column"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
