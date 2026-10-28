import Link from "next/link";
import type { Range } from "@/lib/queries/overview";

const options: { value: Range; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

// Plain links (?range=30d): the server does the filtering and every view can be bookmarked.
export function RangeFilter({ value }: { value: Range }) {
  return (
    <nav aria-label="Date range" className="inline-flex rounded-full border border-line bg-surface p-1 text-sm">
      {options.map((o) => (
        <Link
          key={o.value}
          href={`/?range=${o.value}`}
          aria-current={o.value === value ? "page" : undefined}
          className={`rounded-full px-3 py-1.5 whitespace-nowrap transition-colors ${
            o.value === value ? "bg-fg text-bg" : "text-muted hover:text-fg"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
