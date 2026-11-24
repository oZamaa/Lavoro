"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/field-styles";
import { ApiError, api } from "@/lib/api-client";

type ImportResult = { imported: number; deleted: number };
type Mode = "append" | "replace";

const MAX_BYTES = 5_000_000;

/** Backup dialog: download CSV/JSON exports, import a CSV/JSON file. */
export function TransferDialog() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("append");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleOpenChange(open: boolean) {
    if (open) return;
    // The board holds its own state: reload so it shows what was imported.
    if (result) window.location.reload();
    setFile(null);
    setMode("append");
    setConfirmReplace(false);
    setError(null);
  }

  async function handleImport() {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("Fichier trop volumineux (5 Mo maximum).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const content = await file.text();
      const format = file.name.toLowerCase().endsWith(".json") ? "json" : "csv";
      setResult(
        await api<ImportResult>("/api/import", {
          method: "POST",
          body: { format, mode, content },
        }),
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de lire le fichier.");
    } finally {
      setBusy(false);
    }
  }

  const canImport = !!file && !busy && (mode === "append" || confirmReplace);

  return (
    <Dialog.Root onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button type="button" className={secondaryButtonClass}>
          Sauvegarde
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-[fade-in_150ms_ease-out] bg-black/40" />
        <Dialog.Content
          aria-describedby="transfer-desc"
          className="rounded-card border-border bg-card text-foreground fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto border p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-xl font-semibold">Sauvegarde</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fermer"
                className="rounded-button text-muted hover:bg-column hover:text-foreground inline-flex h-9 w-9 items-center justify-center"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description id="transfer-desc" className="text-muted mt-1 text-sm">
            Exporte tes candidatures ou restaure-les depuis un fichier.
          </Dialog.Description>

          <section className="mt-6" aria-labelledby="export-title">
            <h3 id="export-title" className="mb-2 font-semibold">
              Exporter
            </h3>
            <p className="text-muted mb-3 text-sm">
              Le JSON conserve tout (colonnes, historique) ; le CSV s&apos;ouvre dans un tableur.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/api/export?format=json" download className={secondaryButtonClass}>
                Télécharger en JSON
              </a>
              <a href="/api/export?format=csv" download className={secondaryButtonClass}>
                Télécharger en CSV
              </a>
            </div>
          </section>

          <section className="border-border mt-6 border-t pt-6" aria-labelledby="import-title">
            <h3 id="import-title" className="mb-2 font-semibold">
              Importer
            </h3>

            {result ? (
              <div role="status" className="rounded-button border-border border p-4 text-sm">
                <p className="font-medium">
                  {result.imported} candidature{result.imported > 1 ? "s" : ""} importée
                  {result.imported > 1 ? "s" : ""}.
                </p>
                {result.deleted > 0 && (
                  <p className="text-muted mt-1">
                    {result.deleted} candidature{result.deleted > 1 ? "s" : ""} remplacée
                    {result.deleted > 1 ? "s" : ""}.
                  </p>
                )}
                <Dialog.Close asChild>
                  <button type="button" className={`${primaryButtonClass} mt-4`}>
                    Terminer
                  </button>
                </Dialog.Close>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="import-file" className="text-sm font-medium">
                    Fichier (.json ou .csv)
                  </label>
                  <input
                    id="import-file"
                    type="file"
                    accept=".json,.csv,.txt,application/json,text/csv"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] ?? null);
                      setError(null);
                    }}
                    className={inputClass}
                  />
                  <p className="text-muted text-xs">
                    CSV : colonnes <code>company</code> et <code>title</code> obligatoires, puis{" "}
                    <code>column</code>, <code>city</code>, <code>url</code>, <code>source</code>,{" "}
                    <code>contract</code>, <code>remote</code> (yes/no/hybrid), <code>salary</code>,{" "}
                    <code>appliedAt</code> et <code>followUpAt</code> (AAAA-MM-JJ),{" "}
                    <code>contactName</code>, <code>contactEmail</code>, <code>notes</code>.
                  </p>
                </div>

                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1 text-sm font-medium">Mode d&apos;import</legend>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name="import-mode"
                      checked={mode === "append"}
                      onChange={() => setMode("append")}
                      className="mt-1"
                    />
                    <span>Ajouter aux candidatures existantes</span>
                  </label>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name="import-mode"
                      checked={mode === "replace"}
                      onChange={() => setMode("replace")}
                      className="mt-1"
                    />
                    <span>Remplacer toutes les candidatures (restauration)</span>
                  </label>
                </fieldset>

                {mode === "replace" && (
                  <label className="border-danger text-danger-text rounded-button flex items-start gap-2 border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={confirmReplace}
                      onChange={(e) => setConfirmReplace(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      Je comprends que toutes les candidatures actuelles seront supprimées
                      définitivement avant l&apos;import.
                    </span>
                  </label>
                )}

                {error && (
                  <p role="alert" className="text-danger-text text-sm">
                    {error}
                  </p>
                )}

                <div>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!canImport}
                    className={primaryButtonClass}
                  >
                    {busy ? "Import en cours…" : "Importer"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
