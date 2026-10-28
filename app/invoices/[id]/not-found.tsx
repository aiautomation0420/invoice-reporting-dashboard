import Link from "next/link";

export default function InvoiceNotFound() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
      <h1 className="text-lg font-semibold">Invoice not found</h1>
      <p className="mt-2 text-sm text-muted">It may have been removed, or the link is incomplete.</p>
      <Link href="/invoices" className="mt-6 inline-flex rounded-full bg-fg px-5 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-80">
        Back to invoices
      </Link>
    </div>
  );
}
