import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PAGE_SIZE, listInvoices, parseFilters, vendorOptions, type InvoiceFilters as Filters } from "@/lib/queries/invoices";
import { date, money, sourceLabel } from "@/lib/format";
import { InvoiceFilters } from "@/components/InvoiceFilters";
import { LastUpdated } from "@/components/LastUpdated";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata: Metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

/** URL for these filters on another page number. */
function href(f: Filters, page: number) {
  const params = new URLSearchParams();
  for (const key of ["q", "status", "vendor", "from", "to"] as const) if (f[key]) params.set(key, f[key]!);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/invoices?${query}` : "/invoices";
}

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = parseFilters(await searchParams);
  const [result, vendors] = await Promise.all([listInvoices(filters), vendorOptions()]);
  if (!result) redirect(href(filters, 1)); // page number past the end
  const { rows, total } = result;
  const filtered = href(filters, 1) !== "/invoices";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="mt-1 text-sm text-muted">Every invoice the agent processed, newest first.</p>
      </div>

      <InvoiceFilters filters={filters} vendors={vendors} />

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
          {filtered ? (
            <>
              No invoices match these filters.{" "}
              <Link href="/invoices" className="text-fg underline underline-offset-4">Clear filters</Link>
            </>
          ) : (
            "No invoices yet. They will appear here as soon as the n8n agent processes one."
          )}
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Processed</th>
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Invoice #</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((inv) => (
                  <tr key={inv.id} className="relative transition-colors hover:bg-fg/[0.03]">
                    <td className="px-5 py-3 whitespace-nowrap text-muted tabular-nums">{date(inv.created_at)}</td>
                    <td className="px-5 py-3">
                      {/* The link covers the whole row (after:absolute), so any part of the row opens the invoice. */}
                      <Link href={`/invoices/${inv.id}`} className="font-medium after:absolute after:inset-0 after:content-['']">
                        {inv.vendor ?? <span className="text-muted">Unreadable file</span>}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{inv.invoice_number ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">{money(inv.total, inv.currency)}</td>
                    <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3 text-muted">{sourceLabel(inv.source)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone: cards */}
          <ul className="space-y-3 md:hidden">
            {rows.map((inv) => (
              <li key={inv.id}>
                <Link href={`/invoices/${inv.id}`} className="block rounded-2xl border border-line bg-surface p-4 active:bg-fg/[0.03]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{inv.vendor ?? "Unreadable file"}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted">{inv.invoice_number ?? "—"}</p>
                    </div>
                    <p className="font-medium tabular-nums">{money(inv.total, inv.currency)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                    <StatusBadge status={inv.status} />
                    <span>{date(inv.created_at)} · {sourceLabel(inv.source)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination page={filters.page} pageSize={PAGE_SIZE} total={total} hrefFor={(p) => href(filters, p)} />
        </>
      )}

      <LastUpdated at={new Date().toISOString()} />
    </div>
  );
}
