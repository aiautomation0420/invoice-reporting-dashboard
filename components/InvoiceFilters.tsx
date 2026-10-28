import Link from "next/link";
import { STATUSES } from "@/lib/config";
import type { InvoiceFilters as Filters } from "@/lib/queries/invoices";

const field = "h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg";
const label = "mb-1 block text-xs text-muted";

// A plain GET form: "Apply" puts the filters in the URL and the server does the filtering. No JavaScript needed.
export function InvoiceFilters({ filters, vendors }: { filters: Filters; vendors: string[] }) {
  const active = Boolean(filters.status || filters.vendor || filters.from || filters.to || filters.q);
  return (
    <form method="get" action="/invoices" className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface p-4 lg:grid-cols-[2fr_1fr_1.5fr_1fr_1fr_auto]">
      <div className="col-span-2 lg:col-span-1">
        <label htmlFor="q" className={label}>Search</label>
        <input id="q" name="q" type="search" defaultValue={filters.q} placeholder="Invoice # or vendor" className={field} />
      </div>
      <div>
        <label htmlFor="status" className={label}>Status</label>
        <select id="status" name="status" defaultValue={filters.status ?? ""} className={`${field} cursor-pointer`}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="vendor" className={label}>Vendor</label>
        <select id="vendor" name="vendor" defaultValue={filters.vendor ?? ""} className={`${field} cursor-pointer`}>
          <option value="">All vendors</option>
          {vendors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="from" className={label}>Processed from</label>
        <input id="from" name="from" type="date" defaultValue={filters.from} className={field} />
      </div>
      <div>
        <label htmlFor="to" className={label}>Processed to</label>
        <input id="to" name="to" type="date" defaultValue={filters.to} className={field} />
      </div>
      <div className="col-span-2 flex items-end gap-2 lg:col-span-1">
        <button type="submit" className="h-10 flex-1 cursor-pointer rounded-full bg-fg px-5 text-sm font-medium text-bg transition-opacity hover:opacity-80 lg:flex-none">
          Apply
        </button>
        {active && (
          <Link href="/invoices" className="flex h-10 items-center rounded-full border border-line px-4 text-sm text-muted transition-colors hover:text-fg">
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
