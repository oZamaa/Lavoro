export function StatCard({
  label,
  value,
  hint,
  highlight = false,
}: {
  label: string;
  value: number;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-card border-border border p-4 ${
        highlight ? "bg-primary text-primary-foreground" : "bg-card"
      }`}
    >
      <p className={`text-sm ${highlight ? "opacity-80" : "text-muted"}`}>{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className={`mt-1 text-sm ${highlight ? "opacity-80" : "text-muted"}`}>{hint}</p>}
    </div>
  );
}
