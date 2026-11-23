"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { secondaryButtonClass } from "@/components/ui/field-styles";
import { api } from "@/lib/api-client";
import type { ApplicationDetail } from "@/lib/application-types";
import type { BoardColumn } from "@/lib/board";
import { ApplicationEditor } from "./ApplicationEditor";

export type DrawerTarget = { mode: "create"; columnId: number } | { mode: "edit"; id: number };

/** Side panel to create or edit an application. Mount it to open, unmount it to close. */
export function CardDrawer({
  target,
  columns,
  onClose,
  onSaved,
  onDeleted,
}: {
  target: DrawerTarget;
  columns: BoardColumn[];
  onClose: () => void;
  onSaved: (row: ApplicationDetail) => void;
  onDeleted: (id: number) => void;
}) {
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const editId = target.mode === "edit" ? target.id : null;

  useEffect(() => {
    if (editId === null) return;
    let cancelled = false;
    api<ApplicationDetail>(`/api/applications/${editId}`)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Impossible de charger cette candidature.");
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const ready = target.mode === "create" || detail !== null;
  const defaultColumnId = target.mode === "create" ? target.columnId : (detail?.columnId ?? 0);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-[fade-in_150ms_ease-out] bg-black/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="border-border bg-card text-foreground fixed inset-y-0 right-0 z-50 flex w-full max-w-md animate-[drawer-in_200ms_ease-out] flex-col border-l"
        >
          <header className="flex items-center justify-between px-6 pt-5">
            <Dialog.Title className="text-xl font-semibold">
              {target.mode === "create"
                ? "Nouvelle candidature"
                : (detail?.company ?? "Candidature")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fermer le panneau"
                className="rounded-button text-muted hover:bg-column hover:text-foreground inline-flex h-9 w-9 items-center justify-center"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </header>

          {loadError && (
            <div className="flex flex-col items-start gap-3 p-6">
              <p role="alert" className="text-danger-text text-sm">
                {loadError}
              </p>
              <button type="button" onClick={onClose} className={secondaryButtonClass}>
                Fermer
              </button>
            </div>
          )}
          {!ready && !loadError && <p className="text-muted p-6 text-sm">Chargement…</p>}
          {ready && (
            <ApplicationEditor
              initial={target.mode === "edit" ? detail : null}
              columns={columns}
              defaultColumnId={defaultColumnId}
              onSaved={onSaved}
              onDeleted={onDeleted}
              onClose={onClose}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
