import { z } from "zod";
import { REMOTE_VALUES } from "@/db/schema";

/** Empty / whitespace-only strings become null. */
const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());

const optionalUrl = z.preprocess(
  emptyToNull,
  z
    .string()
    .trim()
    .max(2048)
    .refine((v) => {
      try {
        const { protocol } = new URL(v);
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    }, "URL http(s) invalide")
    .nullable()
    .optional(),
);

const optionalEmail = z.preprocess(
  emptyToNull,
  z.string().trim().max(320).pipe(z.email("Email invalide")).nullable().optional(),
);

const optionalDate = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ")
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
    }, "Date invalide")
    .nullable()
    .optional(),
);

const optionalRemote = z.preprocess(emptyToNull, z.enum(REMOTE_VALUES).nullable().optional());

const idSchema = z.number().int().positive();

const applicationFields = {
  company: z
    .string({ error: "Entreprise obligatoire" })
    .trim()
    .min(1, "Entreprise obligatoire")
    .max(200),
  title: z.string({ error: "Poste obligatoire" }).trim().min(1, "Poste obligatoire").max(200),
  city: optionalText(120),
  url: optionalUrl,
  source: optionalText(120),
  contract: optionalText(60),
  remote: optionalRemote,
  salary: optionalText(120),
  appliedAt: optionalDate,
  followUpAt: optionalDate,
  notes: optionalText(10_000),
  contactName: optionalText(200),
  contactEmail: optionalEmail,
};

export const createApplicationSchema = z.strictObject({
  ...applicationFields,
  /** Defaults to the first column. */
  columnId: idSchema.optional(),
});

/** Column changes go through the `move` route, never through PATCH. */
export const updateApplicationSchema = z
  .strictObject(applicationFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Aucun champ à modifier");

export const moveApplicationSchema = z.strictObject({
  columnId: idSchema,
  /** 0-based index in the target column; defaults to the end. */
  position: z.number().int().min(0).optional(),
});

const columnName = z.string().trim().min(1, "Nom obligatoire").max(60);

export const createColumnSchema = z.strictObject({ name: columnName });

export const updateColumnSchema = z
  .strictObject({ name: columnName, position: z.number().int().min(0) })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Aucun champ à modifier");

const historyEntry = z.object({
  from: z.string().nullable(),
  to: z.string().nullable(),
  changedAt: z.iso.datetime(),
});

/** One application in an import file (CSV row or JSON item). Extra keys are ignored. */
export const importRowSchema = z.object({
  ...applicationFields,
  /** Existing column name (matched without accents/case); unknown names are refused. */
  column: optionalText(60),
  createdAt: z.preprocess(emptyToNull, z.iso.datetime().nullable().optional()),
  updatedAt: z.preprocess(emptyToNull, z.iso.datetime().nullable().optional()),
  history: z.array(historyEntry).max(500).optional(),
});

export const importRequestSchema = z.strictObject({
  format: z.enum(["csv", "json"]),
  mode: z.enum(["append", "replace"]),
  content: z.string().min(1, "Fichier vide").max(5_000_000, "Fichier trop volumineux (5 Mo max)"),
});

export const exportQuerySchema = z.object({ format: z.enum(["csv", "json"]).default("json") });

export type ImportRow = z.infer<typeof importRowSchema>;
export type ImportRequest = z.infer<typeof importRequestSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type MoveApplicationInput = z.infer<typeof moveApplicationSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
