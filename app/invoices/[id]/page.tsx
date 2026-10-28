import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FLAG_HELP } from "@/lib/config";
import { getInvoice } from "@/lib/queries/invoices";
import { mathIssues } from "@/lib/report";
import { count, date, dateTime, duration, flagLabel, money, percent, sourceLabel } from "@/lib/format";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const invoice = await getInvoice((await params).id);
  return { title: invoice ? `${invoice.vendor ?? "Invoice"} ${invoice.invoice_number ?? ""}`.trim() : "Invoice not found" };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words">{children ?? "—"}</dd>
    </div>
  );
}

export default async function InvoicePage({ params }: Props) {
  const inv = await getInvoice((await params).id);
  if (!inv) notFound();

  const flags = inv.flag_reasons ?? [];
  const items = inv.line_items ?? [];
  const issues = mathIssues(inv);
  const reviewed = inv.reviewed_at && (inv.status === "approved" || inv.status === "rejected");
  const cur = inv.currency;

  return (
    <div className="space-y-6">
      <Link href="/invoices" className="text-sm text-muted transition-colors hover:text-fg">
        ← All invoices
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{inv.vendor ?? "Unreadable file"}</h1>
            <StatusBadge status={inv.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            Invoice <span className="font-mono">{inv.invoice_number ?? "—"}</span> · processed {dateTime(inv.created_at)}
            {inv.processingMs != null && ` in ${(inv.processingMs / 1000).toFixed(1)} s`}
          </p>
        </div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{money(inv.total, cur)}</p>
      </div>

      {(flags.length > 0 || reviewed) && (
        <section className="space-y-3 rounded-2xl border border-flagged/40 bg-flagged/5 p-5">
          {flags.length > 0 && (
            <>
              <h2 className="text-sm font-semibold">
                Why it was flagged ({count(flags.length)} {flags.length === 1 ? "check" : "checks"} failed)
              </h2>
              <ul className="space-y-2">
                {flags.map((code) => (
                  <li key={code} className="text-sm">
                    <span className="font-medium">{flagLabel(code)}</span>
                    {FLAG_HELP[code] && <span className="text-muted"> · {FLAG_HELP[code]}</span>}
                  </li>
                ))}
                {issues.map((issue) => (
                  <li key={issue} className="text-sm text-muted">→ {issue}</li>
                ))}
              </ul>
            </>
          )}
          {inv.status === "flagged" && <p className="text-sm">Waiting for a person to approve or reject it.</p>}
          {reviewed && (
            <p className="text-sm">
              <span className="font-medium">{inv.status === "approved" ? "Approved" : "Rejected"}</span> on {dateTime(inv.reviewed_at)},{" "}
              {duration(Date.parse(inv.reviewed_at!) - Date.parse(inv.created_at))} after it was processed.
            </p>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel title="Line items">
          {items.length === 0 ? (
            <p className="text-sm text-muted">No line items were extracted.</p>
          ) : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-2 font-medium">Description</th>
                    <th className="px-5 py-2 text-right font-medium">Qty</th>
                    <th className="px-5 py-2 text-right font-medium">Unit price</th>
                    <th className="px-5 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line tabular-nums">
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-5 py-2">{item.description ?? "—"}</td>
                      <td className="px-5 py-2 text-right">{item.quantity ?? "—"}</td>
                      <td className="px-5 py-2 text-right">{money(item.unit_price, cur)}</td>
                      <td className="px-5 py-2 text-right">{money(item.amount, cur)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="tabular-nums">
                  <tr className="border-t border-line">
                    <td colSpan={3} className="px-5 pt-3 text-right text-muted">Subtotal</td>
                    <td className="px-5 pt-3 text-right">{money(inv.subtotal, cur)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-5 py-1 text-right text-muted">Tax</td>
                    <td className="px-5 py-1 text-right">{money(inv.tax, cur)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-5 pb-1 text-right font-semibold">Total</td>
                    <td className="px-5 pb-1 text-right font-semibold">{money(inv.total, cur)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Details">
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            <Field label="Vendor on invoice">{inv.vendor}</Field>
            <Field label="Matched approved vendor">{inv.vendor_matched}</Field>
            <Field label="Invoice date">{date(inv.invoice_date)}</Field>
            <Field label="Due date">{date(inv.due_date)}</Field>
            <Field label="PO number">{inv.po_number}</Field>
            <Field label="Currency">{inv.currency}</Field>
            <Field label="Source">{sourceLabel(inv.source)}</Field>
            <Field label="File name">{inv.file_name}</Field>
          </dl>
          {/* Only plain https links: the value comes from the database, never trust it as a raw href. */}
          {inv.file_link?.startsWith("https://") && (
            <div className="mt-5 border-t border-line pt-4">
              <a href={inv.file_link} target="_blank" rel="noreferrer" className="text-sm font-medium underline decoration-line underline-offset-4 hover:decoration-fg">
                Open original file ↗
              </a>
              {inv.is_demo && <p className="mt-1 text-xs text-muted">Demo data: this link is a placeholder.</p>}
            </div>
          )}
        </Panel>
      </div>

      {inv.confidence && Object.keys(inv.confidence).length > 0 && (
        <Panel title="AI extraction confidence" subtitle="How sure the AI was about each field (100% = certain)">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(inv.confidence).map(([fieldName, score]) => (
              <Field key={fieldName} label={fieldName.replaceAll("_", " ")}>
                {typeof score === "number" ? percent(score) : String(score)}
              </Field>
            ))}
          </dl>
        </Panel>
      )}

      {inv.fingerprint && (
        <p className="text-xs text-muted">
          Duplicate fingerprint: <span className="font-mono">{inv.fingerprint}</span>
        </p>
      )}
    </div>
  );
}
