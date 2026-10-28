import { db } from "@/lib/supabase";
import { STATUSES, type Status } from "@/lib/config";
import { DAY, parseDateKey } from "@/lib/week";

export const PAGE_SIZE = 25;

export type LineItem = { description?: string; quantity?: number; unit_price?: number; amount?: number };

export type Invoice = {
  id: string;
  vendor: string | null;
  vendor_matched: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  currency: string | null;
  po_number: string | null;
  line_items: LineItem[] | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  confidence: Record<string, number> | null;
  status: Status;
  flag_reasons: string[] | null;
  fingerprint: string | null;
  source: "gmail" | "drive" | null;
  file_name: string | null;
  file_link: string | null;
  reviewed_at: string | null;
  created_at: string;
  is_demo: boolean;
};

export type InvoiceListRow = Pick<Invoice, "id" | "created_at" | "vendor" | "invoice_number" | "total" | "currency" | "status" | "source">;

export type InvoiceFilters = { status?: Status; vendor?: string; from?: string; to?: string; q?: string; page: number };

/** Reads the filters from the URL, dropping anything that isn't valid. */
export function parseFilters(params: Record<string, string | undefined>): InvoiceFilters {
  const status = STATUSES.find((s) => s === params.status);
  // The search goes into a PostgREST "or" filter: keep only characters that can't change its meaning.
  const q = params.q?.replace(/[^\p{L}\p{N} .&#/-]/gu, "").trim().slice(0, 60);
  return {
    status,
    vendor: params.vendor || undefined,
    from: parseDateKey(params.from) != null ? params.from : undefined,
    to: parseDateKey(params.to) != null ? params.to : undefined,
    q: q || undefined,
    page: Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1),
  };
}

/** One page of invoices, newest first. Returns null if the page number is past the end. */
export async function listInvoices(f: InvoiceFilters) {
  let query = db()
    .from("invoices")
    .select("id, created_at, vendor, invoice_number, total, currency, status, source", { count: "exact" });
  if (f.status) query = query.eq("status", f.status);
  if (f.vendor) query = query.eq("vendor", f.vendor);
  const from = parseDateKey(f.from);
  const to = parseDateKey(f.to);
  if (from != null) query = query.gte("created_at", new Date(from).toISOString());
  if (to != null) query = query.lt("created_at", new Date(to + DAY).toISOString()); // "to" date is included
  if (f.q) query = query.or(`invoice_number.ilike.%${f.q}%,vendor.ilike.%${f.q}%`);

  const start = (f.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.order("created_at", { ascending: false }).range(start, start + PAGE_SIZE - 1);
  if (error?.code === "PGRST103") return null; // page past the end
  if (error) throw new Error(error.message);
  return { rows: data as InvoiceListRow[], total: count ?? 0 };
}

// shortcut: reads the vendor column of the newest 1000 invoices; switch to a SQL view of distinct vendors when there are more.
export async function vendorOptions() {
  const { data, error } = await db()
    .from("invoices")
    .select("vendor")
    .not("vendor", "is", null)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  return [...new Set(data.map((r) => r.vendor as string))].sort((a, b) => a.localeCompare(b));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One invoice plus how long the agent took on it. Null if it doesn't exist. */
export async function getInvoice(id: string) {
  if (!UUID.test(id)) return null;
  const [invoice, run] = await Promise.all([
    db().from("invoices").select("*").eq("id", id).maybeSingle(),
    db().from("run_log").select("processing_ms").eq("invoice_id", id).limit(1),
  ]);
  if (invoice.error) throw new Error(invoice.error.message);
  if (!invoice.data) return null;
  return { ...(invoice.data as Invoice), processingMs: (run.data?.[0]?.processing_ms as number | undefined) ?? null };
}
