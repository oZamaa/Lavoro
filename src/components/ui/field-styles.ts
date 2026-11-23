export const inputClass =
  "w-full rounded-button border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted disabled:opacity-60";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-button bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-button border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-column disabled:opacity-50";

export const dangerButtonClass =
  "inline-flex items-center justify-center rounded-button border border-danger bg-card px-4 py-2 text-sm font-medium text-danger-text transition-colors duration-150 hover:bg-column disabled:opacity-50";

/** Shared a11y props for an input and its error message. */
export function fieldProps(id: string, error?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}
