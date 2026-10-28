// Fails the build if any browser (client) component ever imports this file.
import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Which rows the site shows. Default "demo" (the public site): seeded rows only.
 * "all" or "real" show n8n's real invoices and are meant for running locally.
 */
export type DataScope = "demo" | "real" | "all";
const scope = process.env.DATA_SCOPE;
export const DATA_SCOPE: DataScope = scope === "real" || scope === "all" ? scope : "demo";

/** Raw links to n8n runs and Gmail/Drive files. Off unless SHOW_PRIVATE_LINKS=true (local only). */
export const SHOW_PRIVATE_LINKS = process.env.SHOW_PRIVATE_LINKS === "true";

// Only server code calls this; the env names have no NEXT_PUBLIC_ prefix, so they never reach the browser.
export function db() {
  const url = process.env.SUPABASE_URL;
  // The publishable key can only read demo rows (supabase/security-hardening.sql). Real rows need the
  // secret key, which is allowed on your own computer only, never on Vercel.
  let key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (DATA_SCOPE !== "demo") {
    if (process.env.VERCEL) throw new Error("DATA_SCOPE other than demo is not allowed on Vercel.");
    key = process.env.SUPABASE_SECRET_KEY;
  }
  if (!url || !key) {
    throw new Error("Supabase is not set up. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env.local.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Reads a table, keeping only the rows DATA_SCOPE allows. Use this for every query the site makes. */
export function scoped(table: "invoices" | "run_log" | "error_log", columns: string, options?: { count?: "exact"; head?: boolean }) {
  const query = db().from(table).select(columns, options);
  return DATA_SCOPE === "all" ? query : query.eq("is_demo", DATA_SCOPE === "demo");
}

/** True when the rows on screen include seeded demo rows. */
export async function hasDemoData() {
  if (DATA_SCOPE === "demo") return true;
  if (DATA_SCOPE === "real") return false;
  try {
    const { count } = await db().from("invoices").select("id", { count: "exact", head: true }).eq("is_demo", true);
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}
