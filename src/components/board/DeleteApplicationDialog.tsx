"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  dangerButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/field-styles";

export function DeleteApplicationDialog({
  company,
  disabled,
  onConfirm,
}: {
  company: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button type="button" disabled={disabled} className={dangerButtonClass}>
          Supprimer
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
        <AlertDialog.Content className="rounded-card border-border bg-card text-foreground shadow-card fixed top-1/2 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 border p-6">
          <AlertDialog.Title className="text-lg font-semibold">
            Supprimer cette candidature ?
          </AlertDialog.Title>
          <AlertDialog.Description className="text-muted mt-2 text-sm">
            « {company} » et son historique seront définitivement supprimés. Cette action est
            irréversible.
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button type="button" className={secondaryButtonClass}>
                Annuler
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button type="button" onClick={onConfirm} className={primaryButtonClass}>
                Oui, supprimer
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
