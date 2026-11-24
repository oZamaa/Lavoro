import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { primaryButtonClass } from "@/components/ui/field-styles";

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Page introuvable</h1>
        <p className="text-muted text-sm">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link href="/" className={primaryButtonClass}>
          Retour au tableau
        </Link>
      </div>
    </AppShell>
  );
}
