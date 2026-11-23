"use client";

import type { FormEvent, ReactNode } from "react";
import { Field } from "@/components/ui/Field";
import { fieldProps, inputClass } from "@/components/ui/field-styles";
import type { FieldName, FormValues } from "@/lib/application-types";
import type { BoardColumn } from "@/lib/board";

export function ApplicationForm({
  values,
  errors,
  columns,
  disabled,
  onChange,
  onSubmit,
  footer,
}: {
  values: FormValues;
  errors: Record<string, string>;
  columns: BoardColumn[];
  disabled: boolean;
  onChange: (name: FieldName | "columnId", value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  footer: ReactNode;
}) {
  const text = (name: FieldName, type: "text" | "url" | "email" | "date" = "text") => (
    <input
      {...fieldProps(`f-${name}`, errors[name])}
      name={name}
      type={type}
      value={values[name]}
      disabled={disabled}
      onChange={(e) => onChange(name, e.target.value)}
      className={inputClass}
    />
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
        <Field id="f-company" label="Entreprise" required error={errors.company}>
          <input
            {...fieldProps("f-company", errors.company)}
            name="company"
            required
            value={values.company}
            disabled={disabled}
            onChange={(e) => onChange("company", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id="f-title" label="Poste" required error={errors.title}>
          <input
            {...fieldProps("f-title", errors.title)}
            name="title"
            required
            value={values.title}
            disabled={disabled}
            onChange={(e) => onChange("title", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field id="f-columnId" label="Statut" error={errors.columnId}>
          <select
            {...fieldProps("f-columnId", errors.columnId)}
            name="columnId"
            value={values.columnId}
            disabled={disabled}
            onChange={(e) => onChange("columnId", e.target.value)}
            className={inputClass}
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field id="f-city" label="Ville" error={errors.city}>
            {text("city")}
          </Field>
          <Field id="f-contract" label="Contrat" error={errors.contract}>
            <input
              {...fieldProps("f-contract", errors.contract)}
              name="contract"
              list="contract-options"
              value={values.contract}
              disabled={disabled}
              onChange={(e) => onChange("contract", e.target.value)}
              className={inputClass}
            />
            <datalist id="contract-options">
              {["CDI", "CDD", "Alternance", "Stage", "Freelance", "Intérim"].map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </Field>
          <Field id="f-remote" label="Télétravail" error={errors.remote}>
            <select
              {...fieldProps("f-remote", errors.remote)}
              name="remote"
              value={values.remote}
              disabled={disabled}
              onChange={(e) => onChange("remote", e.target.value)}
              className={inputClass}
            >
              <option value="">Non précisé</option>
              <option value="yes">Oui</option>
              <option value="no">Non</option>
              <option value="hybrid">Hybride</option>
            </select>
          </Field>
          <Field id="f-salary" label="Salaire" error={errors.salary}>
            {text("salary")}
          </Field>
        </div>

        <Field id="f-url" label="Lien de l'offre" error={errors.url}>
          {text("url", "url")}
        </Field>
        <Field id="f-source" label="Source" error={errors.source}>
          <input
            {...fieldProps("f-source", errors.source)}
            name="source"
            list="source-options"
            value={values.source}
            disabled={disabled}
            onChange={(e) => onChange("source", e.target.value)}
            className={inputClass}
          />
          <datalist id="source-options">
            {[
              "LinkedIn",
              "Indeed",
              "Welcome to the Jungle",
              "Site de l'entreprise",
              "Cooptation",
            ].map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field id="f-appliedAt" label="Date de candidature" error={errors.appliedAt}>
            {text("appliedAt", "date")}
          </Field>
          <Field id="f-followUpAt" label="Prochaine relance" error={errors.followUpAt}>
            {text("followUpAt", "date")}
          </Field>
          <Field id="f-contactName" label="Contact" error={errors.contactName}>
            {text("contactName")}
          </Field>
          <Field id="f-contactEmail" label="Email du contact" error={errors.contactEmail}>
            {text("contactEmail", "email")}
          </Field>
        </div>

        <Field id="f-notes" label="Notes" error={errors.notes}>
          <textarea
            {...fieldProps("f-notes", errors.notes)}
            name="notes"
            rows={5}
            value={values.notes}
            disabled={disabled}
            onChange={(e) => onChange("notes", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="border-border flex items-center gap-3 border-t px-6 py-4">{footer}</div>
    </form>
  );
}
