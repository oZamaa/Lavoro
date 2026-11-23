"use client";

import { useState, type FormEvent } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui/field-styles";
import { ApiError, api } from "@/lib/api-client";
import {
  toFormValues,
  type ApplicationDetail,
  type FieldName,
  type FormValues,
} from "@/lib/application-types";
import type { BoardColumn } from "@/lib/board";
import { ApplicationForm } from "./ApplicationForm";
import { CardHistory } from "./CardHistory";
import { DeleteApplicationDialog } from "./DeleteApplicationDialog";

/** Form state + API calls for creating (initial = null) or editing one application. */
export function ApplicationEditor({
  initial,
  columns,
  defaultColumnId,
  onSaved,
  onDeleted,
  onClose,
}: {
  initial: ApplicationDetail | null;
  columns: BoardColumn[];
  defaultColumnId: number;
  onSaved: (row: ApplicationDetail) => void;
  onDeleted: (id: number) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(initial, defaultColumnId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleError(error: unknown) {
    if (error instanceof ApiError) {
      setErrors(error.fieldErrors);
      if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message);
      else setFormError("Certains champs sont invalides.");
    } else {
      setFormError("Erreur inattendue.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    setBusy(true);
    try {
      const { columnId, ...fields } = values;
      let row: ApplicationDetail;
      if (!initial) {
        row = await api<ApplicationDetail>("/api/applications", {
          method: "POST",
          body: { ...fields, columnId: Number(columnId) },
        });
      } else {
        row = await api<ApplicationDetail>(`/api/applications/${initial.id}`, {
          method: "PATCH",
          body: fields,
        });
        if (Number(columnId) !== initial.columnId) {
          row = await api<ApplicationDetail>(`/api/applications/${initial.id}/move`, {
            method: "POST",
            body: { columnId: Number(columnId) },
          });
        }
      }
      onSaved(row);
    } catch (error) {
      handleError(error);
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    setBusy(true);
    setFormError(null);
    try {
      await api<void>(`/api/applications/${initial.id}`, { method: "DELETE" });
      onDeleted(initial.id);
    } catch (error) {
      handleError(error);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {formError && (
        <p
          role="alert"
          className="rounded-button border-danger text-danger-text mx-6 mt-4 border px-3 py-2 text-sm"
        >
          {formError}
        </p>
      )}
      <ApplicationForm
        values={values}
        errors={errors}
        columns={columns}
        disabled={busy}
        onChange={(name: FieldName | "columnId", value) =>
          setValues((v) => ({ ...v, [name]: value }))
        }
        onSubmit={handleSubmit}
        footer={
          <>
            <button type="submit" disabled={busy} className={primaryButtonClass}>
              {initial ? "Enregistrer" : "Créer la candidature"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className={secondaryButtonClass}
            >
              Annuler
            </button>
            {initial && (
              <span className="ml-auto">
                <DeleteApplicationDialog
                  company={initial.company}
                  disabled={busy}
                  onConfirm={handleDelete}
                />
              </span>
            )}
          </>
        }
      />
      {initial?.history && initial.history.length > 0 && (
        <div className="max-h-48 overflow-y-auto">
          <CardHistory history={initial.history} columns={columns} />
        </div>
      )}
    </div>
  );
}
