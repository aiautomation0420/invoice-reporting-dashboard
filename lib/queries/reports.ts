import { db } from "@/lib/supabase";
import { summarize, type InvoiceRow } from "@/lib/report";
import { WEEK, parseWeekKey, dateKey, weekStart } from "@/lib/week";

const PAGE = 1000; // Supabase returns at most 1000 rows per request

/** Invoice rows created in [from, to), fetched page by page. */
export async function invoicesBetween(from: number, to: number) {
  const rows: InvoiceRow[] = [];
  for (let page = 0; ; page++) {
    const { data, error } = await db()
      .from("invoices")
      .select("status, flag_reasons, total, created_at, vendor")
      .gte("created_at", new Date(from).toISOString())
      .lt("created_at", new Date(to).toISOString())
      .order("created_at")
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data as InvoiceRow[]));
    if (data.length < PAGE) return rows;
  }
}

async function firstInvoiceAt() {
  const { data, error } = await db().from("invoices").select("created_at").order("created_at").limit(1);
  if (error) throw new Error(error.message);
  return data[0] ? Date.parse(data[0].created_at) : null;
}

/** One week's summary next to the week before. Defaults to the last full week. */
export async function getWeeklyReport(requestedWeek?: string | null) {
  const now = Date.now();
  const thisWeek = weekStart(now);
  const requested = parseWeekKey(requestedWeek);
  const start = requested != null && requested <= thisWeek ? requested : thisWeek - WEEK;

  const [rows, first] = await Promise.all([invoicesBetween(start - WEEK, start + WEEK), firstInvoiceAt()]);
  const inWeek = (row: InvoiceRow) => Date.parse(row.created_at) >= start;

  // Weeks to choose from: newest first, back to the first invoice (max one year).
  const oldest = Math.max(weekStart(first ?? thisWeek - WEEK), thisWeek - 51 * WEEK);
  const weeks = [];
  for (let w = thisWeek; w >= oldest; w -= WEEK) weeks.push({ key: dateKey(w), current: w === thisWeek });

  return {
    key: dateKey(start),
    isCurrentWeek: start === thisWeek,
    weeks,
    current: summarize(rows.filter(inWeek)),
    previous: summarize(rows.filter((r) => !inWeek(r))),
    generatedAt: new Date(now).toISOString(),
  };
}
