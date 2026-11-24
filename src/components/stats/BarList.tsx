/** Horizontal bars with visible numbers (the bars are decorative, values are text). */
export function BarList({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-3 text-sm">
          <span className="truncate">{item.label}</span>
          <span className="bg-column h-1.5 overflow-hidden rounded-sm" aria-hidden="true">
            <span
              className="bg-accent block h-full rounded-sm"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </span>
          <span className="text-right font-medium">{item.count}</span>
        </li>
      ))}
    </ul>
  );
}
