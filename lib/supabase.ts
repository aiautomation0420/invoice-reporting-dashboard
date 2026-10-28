import { createClient } from "@supabase/supabase-js";

// Only server code calls this. The env names have no NEXT_PUBLIC_ prefix,
// so Next.js never sends them to the browser.
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not set up. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .env.local.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/** True when the database still holds seeded demo rows. */
export async function hasDemoData() {
  try {
    const { count } = await db()
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("is_demo", true);
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}
