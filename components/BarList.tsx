/** A simple horizontal bar chart in plain HTML: label, value, and a bar sized to the largest value. */
export function BarList({
  items,
  barClass,
}: {
  items: { label: string; value: number; display: string; note?: string }[];
  barClass: string; // e.g. "bg-flagged"
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 text-sm">
          <span className="truncate" title={item.label}>
            {item.label}
          </span>
          <span className="tabular-nums">
            <span className="font-medium">{item.display}</span>
            {item.note && <span className="text-muted"> · {item.note}</span>}
          </span>
          <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-fg/5">
            <span className={`block h-full rounded-full ${barClass}`} style={{ width: `${(item.value / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
