import Link from "next/link";
import { count } from "@/lib/format";

const button = "flex h-10 items-center rounded-full border border-line px-4 text-sm transition-colors";

/** "Showing 26–50 of 381" with Previous / Next links that keep the current filters. */
export function Pagination({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (page: number) => string }) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted tabular-nums">
        Showing {count(first)}–{count(Math.min(page * pageSize, total))} of {count(total)}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={`${button} hover:border-fg/40`}>Previous</Link>
        ) : (
          <span className={`${button} text-muted opacity-50`} aria-disabled="true">Previous</span>
        )}
        {page < last ? (
          <Link href={hrefFor(page + 1)} className={`${button} hover:border-fg/40`}>Next</Link>
        ) : (
          <span className={`${button} text-muted opacity-50`} aria-disabled="true">Next</span>
        )}
      </div>
    </nav>
  );
}
