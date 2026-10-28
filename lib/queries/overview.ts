import { db } from "@/lib/supabase";
import { buckets, summarize, topVendors } from "@/lib/report";
import { DAY } from "@/lib/week";
import { invoicesBetween } from "./reports";

export const RANGES = { "7d": 7, "30d": 30, "90d": 90, all: null } as const;
export type Range = keyof typeof RANGES;

export function parseRange(value: string | undefined): Range {
  return value && value in RANGES ? (value as Range) : "30d";
}

/** Runs and errors in the last 7 days, whatever range is picked. */
async function systemHealth(now: number) {
  const since = new Date(now - 7 * DAY).toISOString();
  const [runs, errors, last] = await Promise.all([
    db().from("run_log").select("id", { count: "exact", head: true }).gte("created_at", since),
    db().from("error_log").select("id", { count: "exact", head: true }).gte("created_at", since),
    // run_log only gets a row when an invoice was processed successfully.
    db().from("run_log").select("created_at").order("created_at", { ascending: false }).limit(1),
  ]);
  for (const result of [runs, errors, last]) if (result.error) throw new Error(result.error.message);
  return { runs: runs.count ?? 0, errors: errors.count ?? 0, lastRun: (last.data?.[0]?.created_at as string) ?? null };
}

export async function getOverview(range: Range) {
  const now = Date.now();
  const days = RANGES[range];
  const from = days ? now - days * DAY : 0;
  // Also fetch the period before, to show "vs previous 30 days".
  const [rows, health] = await Promise.all([invoicesBetween(days ? from - days * DAY : 0, now), systemHealth(now)]);
  const current = rows.filter((r) => Date.parse(r.created_at) >= from);
  const chartStart = days ? from : current.length ? Date.parse(current[0].created_at) : now;

  return {
    summary: summarize(current),
    previous: days ? summarize(rows.filter((r) => Date.parse(r.created_at) < from)) : null,
    bucketSize: range === "7d" ? ("day" as const) : ("week" as const),
    series: buckets(current, range === "7d" ? "day" : "week", chartStart, now),
    vendors: topVendors(current, 5),
    health,
    generatedAt: new Date(now).toISOString(),
  };
}
