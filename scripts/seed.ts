// Fills Supabase with ~16 weeks of realistic demo data. Every row gets is_demo = true.
// Safe to re-run: it first deletes the old demo rows (real rows are never touched).
// Run: npm run seed   (needs SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local)
// Preview without touching the database: node scripts/seed.ts --dry
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { APPROVAL_LIMIT, FLAG_LABELS, MINUTES_PER_INVOICE, STATUSES } from "../lib/config.ts";

// Seeded random numbers, so every run produces the same mix.
let state = 20261029;
function rand() {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (min: number, max: number) => min + rand() * (max - min);
const int = (min: number, max: number) => Math.floor(between(min, max + 1));
const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)];
const round2 = (n: number) => Math.round(n * 100) / 100;
function weighted(entries: [string, number][]) {
  let r = rand() * entries.reduce((sum, [, w]) => sum + w, 0);
  for (const [value, w] of entries) if ((r -= w) < 0) return value;
  return entries[0][0];
}

type VendorProfile = { name: string; prefix: string; min: number; max: number; items: string[]; taxed: boolean; poChance: number; weight: number };
const VENDORS: VendorProfile[] = [
  { name: "Northwind Office Supply", prefix: "NW", min: 80, max: 900, items: ["Printer paper (case)", "Toner cartridge", "Desk organizers", "Ballpoint pens (box)"], taxed: true, poChance: 0.5, weight: 8 },
  { name: "Apex Cloud Hosting", prefix: "APX", min: 1200, max: 4800, items: ["Compute instances", "Managed database", "Object storage", "Support plan"], taxed: false, poChance: 0.9, weight: 5 },
  { name: "Metro Facilities Cleaning", prefix: "MFC", min: 900, max: 2200, items: ["Weekly office cleaning", "Window service", "Supplies restock"], taxed: true, poChance: 0.8, weight: 5 },
  { name: "Summit Logistics", prefix: "SUM", min: 400, max: 4800, items: ["Freight - LTL", "Last-mile delivery", "Fuel surcharge", "Pallet handling"], taxed: false, poChance: 0.7, weight: 7 },
  { name: "Bluepeak Marketing Agency", prefix: "BPK", min: 2000, max: 6000, items: ["Campaign management", "Paid media spend", "Creative production"], taxed: false, poChance: 0.9, weight: 3 },
  { name: "Harbor Legal Partners", prefix: "HLP", min: 1500, max: 5500, items: ["Contract review (hours)", "Corporate filings", "Advisory retainer"], taxed: false, poChance: 0.4, weight: 2 },
  { name: "Crestline IT Services", prefix: "CIT", min: 800, max: 5000, items: ["Managed IT support", "Laptop setup", "Network maintenance", "Software licenses"], taxed: true, poChance: 0.8, weight: 6 },
  { name: "Evergreen Utilities", prefix: "EVU", min: 300, max: 1500, items: ["Electricity", "Water & sewer", "Service fee"], taxed: true, poChance: 0, weight: 3 },
  { name: "Pinnacle Staffing", prefix: "PIN", min: 2500, max: 6500, items: ["Temporary staff (hours)", "Placement fee", "Overtime"], taxed: false, poChance: 0.9, weight: 3 },
];
// Senders that are not in the approved vendor list (the last one is listed but not approved).
const UNKNOWN_VENDORS = ["Rapid Print Co.", "J&M Consulting LLC", "Coastal Signs & Banners"];

const FLAG_WEIGHTS: [string, number][] = [
  ["math_mismatch", 20],
  ["po_mismatch", 18],
  ["missing_fields", 15],
  ["over_approval_limit", 14],
  ["duplicate", 12],
  ["unknown_vendor", 11],
  ["unreadable_file", 10],
  ["low_confidence", 9],
  ["due_date_before_invoice_date", 6],
];

const normalize = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\b(llc|inc|co|corp|ltd)\b/g, "").replace(/\s+/g, " ").trim();
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const DAY = 86_400_000;

type Invoice = Record<string, unknown> & { id: string; created_at: string; total: number | null };
const invoices: Invoice[] = [];
const purchaseOrders = new Map<string, { po_number: string; vendor: string; amount: number; currency: string; created_at: string; is_demo: true }>();
const counters = new Map<string, number>();
let poCounter = 4100;

const now = Date.now();
const todayStart = new Date(new Date(now).toISOString().slice(0, 10)).getTime();

const DAYS = 112; // 16 weeks
for (let daysAgo = DAYS - 1; daysAgo >= 0; daysAgo--) {
  const progress = 1 - daysAgo / (DAYS - 1); // 0 = oldest day, 1 = today
  const dayStart = todayStart - daysAgo * DAY;
  const weekday = new Date(dayStart).getUTCDay();
  const weekend = weekday === 0 || weekday === 6;
  const perDay = weekend ? int(0, 1) : int(2, 5) + Math.round(progress * 2); // volume grows as more invoices go through the agent

  for (let i = 0; i < perDay; i++) {
    const createdMs = Math.min(dayStart + between(8, 18) * 3_600_000, now - int(5, 120) * 60_000);
    const created_at = new Date(createdMs).toISOString();

    const reasons: string[] = [];
    // The story: fewer flags over time as vendors and POs get cleaned up (clean rate ~45% -> ~70%).
    if (rand() < 0.42 - 0.26 * progress) {
      reasons.push(weighted(FLAG_WEIGHTS));
      if (rand() < 0.15) {
        const second = weighted(FLAG_WEIGHTS);
        if (!reasons.includes(second) && second !== "unreadable_file" && reasons[0] !== "unreadable_file") reasons.push(second);
      }
    }

    const id = crypto.randomUUID();
    const source = rand() < 0.65 ? "gmail" : "drive";
    const file_link =
      source === "gmail"
        ? `https://mail.google.com/mail/u/0/#inbox/demo-${id.slice(0, 8)}`
        : `https://drive.google.com/file/d/demo-${id.slice(0, 8)}/view`;
    const base = { id, created_at, source, file_link, file_name: `${id.slice(0, 8)}.pdf`, currency: "USD", is_demo: true as const };

    // Unreadable file: the workflow saves a stub row with nothing extracted.
    if (reasons[0] === "unreadable_file") {
      invoices.push({ ...base, vendor: null, invoice_number: null, invoice_date: null, due_date: null, po_number: null, line_items: [], subtotal: null, tax: null, total: null, flag_reasons: reasons, fingerprint: null });
      continue;
    }

    // Duplicate: the same invoice arrives again a few days later.
    if (reasons.includes("duplicate")) {
      const earlier = invoices.filter((inv) => inv.total != null && !(inv.flag_reasons as string[]).includes("duplicate")).slice(-25);
      if (earlier.length) {
        const original = pick(earlier);
        invoices.push({ ...original, ...base, flag_reasons: ["duplicate"] });
        continue;
      }
      reasons.splice(reasons.indexOf("duplicate"), 1);
    }

    const vendorName = weighted(VENDORS.map((v) => [v.name, v.weight]));
    const profile = reasons.includes("unknown_vendor")
      ? { ...pick(VENDORS), name: pick(UNKNOWN_VENDORS), poChance: 0, prefix: "INV" }
      : VENDORS.find((v) => v.name === vendorName)!;

    const target = reasons.includes("over_approval_limit") ? between(APPROVAL_LIMIT * 1.05, APPROVAL_LIMIT * 2.4) : between(profile.min, profile.max);
    const itemCount = int(1, Math.min(3, profile.items.length));
    const descriptions = [...profile.items].sort(() => rand() - 0.5).slice(0, itemCount);
    const line_items = descriptions.map((description) => {
      const quantity = int(1, 10);
      const unit_price = round2(target / itemCount / quantity);
      return { description, quantity, unit_price, amount: round2(quantity * unit_price) };
    });
    const subtotal = round2(line_items.reduce((sum, item) => sum + item.amount, 0));
    const tax = profile.taxed ? round2(subtotal * 0.0825) : 0;
    let total = round2(subtotal + tax);
    if (reasons.includes("math_mismatch")) total = round2(total + between(10, 80));
    // Real check, not just a label: anything above the limit is flagged.
    if (total > APPROVAL_LIMIT && !reasons.includes("over_approval_limit")) reasons.push("over_approval_limit");

    const seq = (counters.get(profile.prefix) ?? int(10200, 18000)) + int(1, 9);
    counters.set(profile.prefix, seq);
    let invoice_number: string | null = `${profile.prefix}-${seq}`;
    const invoiceDateMs = createdMs - int(0, 5) * DAY;
    let due_date: string | null = isoDate(invoiceDateMs + (rand() < 0.7 ? 30 : 15) * DAY);

    let po_number: string | null = null;
    if (reasons.includes("po_mismatch") || rand() < profile.poChance) {
      po_number = `PO-${poCounter++}`;
      const amount = reasons.includes("po_mismatch") ? round2(total * (rand() < 0.5 ? between(0.6, 0.9) : between(1.15, 1.4))) : total;
      purchaseOrders.set(po_number, { po_number, vendor: profile.name, amount, currency: "USD", created_at: new Date(invoiceDateMs - int(3, 20) * DAY).toISOString(), is_demo: true });
    }

    if (reasons.includes("due_date_before_invoice_date")) due_date = isoDate(invoiceDateMs - int(3, 25) * DAY);
    if (reasons.includes("missing_fields")) {
      if (rand() < 0.5) due_date = null;
      else invoice_number = null;
    }

    // How sure the AI was about each main field; one low score is what "low_confidence" means.
    const confidence: Record<string, number> = { vendor: 0, invoice_number: 0, invoice_date: 0, total: 0 };
    for (const field in confidence) confidence[field] = round2(between(0.9, 0.99));
    if (reasons.includes("low_confidence")) confidence[pick(Object.keys(confidence))] = round2(between(0.42, 0.74));

    invoices.push({
      ...base,
      confidence,
      vendor: profile.name,
      vendor_matched: reasons.includes("unknown_vendor") ? null : profile.name,
      invoice_number,
      invoice_date: isoDate(invoiceDateMs),
      due_date,
      po_number,
      line_items,
      subtotal,
      tax,
      total,
      flag_reasons: reasons,
      fingerprint: invoice_number ? `${normalize(profile.name)}|${invoice_number}|${total.toFixed(2)}` : null,
    });
  }
}

// Decide statuses: flagged invoices older than 2 days were mostly reviewed by a person.
for (const inv of invoices) {
  const reasons = inv.flag_reasons as string[];
  const createdMs = new Date(inv.created_at).getTime();
  if (!reasons.length) {
    inv.status = "clean";
    inv.reviewed_at = null;
    continue;
  }
  const ageDays = (now - createdMs) / DAY;
  const rejectChance = reasons.includes("duplicate") ? 0.85 : 0.3;
  inv.status = ageDays < 2 || rand() < (ageDays < 14 ? 0.12 : 0.02) ? "flagged" : rand() < rejectChance ? "rejected" : "approved";
  inv.reviewed_at = inv.status === "flagged" ? null : new Date(Math.min(createdMs + between(1, 30) * 3_600_000, now - 60_000)).toISOString();
}

const runLog = invoices.map((inv) => ({
  invoice_id: inv.id,
  processing_ms: (inv.flag_reasons as string[]).includes("unreadable_file") ? int(20_000, 45_000) : int(4_000, 18_000),
  minutes_saved: MINUTES_PER_INVOICE,
  created_at: inv.created_at,
  is_demo: true,
}));

const N8N = "https://your-n8n.app.n8n.cloud/workflow/demo/executions";
const errorLog = [
  // Step names match the real n8n workflow. "Crash Alert" is the Error Trigger workflow that writes these rows.
  [104, "Gmail Trigger", "Invalid credentials: Google OAuth token expired. Reconnect the Gmail credential."],
  [88, "AI Extraction (OpenRouter)", "Request timed out after 120s."],
  [71, "Google Drive Trigger", "User rate limit exceeded for Google Drive API (403)."],
  [52, "Extract from File", "Could not extract text: unsupported file type (.heic)."],
  [44, "AI Extraction (OpenRouter)", "Model response was not valid JSON."],
  [33, "Vendor Match", "Cannot read properties of undefined (reading 'normalized_name')"],
  [26, "Save to Supabase", "Connection timed out after 30s."],
  [17, "Reviewer Email (Send and Wait)", "Gmail send failed: daily sending limit exceeded."],
  [5, "Bookkeeper Checks", "Cannot convert 'N/A' to a number in field 'total'."],
  [2, "Save to Supabase", "duplicate key value violates unique constraint \"purchase_orders_pkey\""],
].map(([daysAgo, node, message], i) => ({
  workflow: "AI Invoice Processing & Audit Agent",
  node,
  message,
  run_link: `${N8N}/${18_240 + i * 137}`,
  created_at: new Date(now - (daysAgo as number) * DAY - int(1, 10) * 3_600_000).toISOString(),
  is_demo: true,
}));

const vendorRows = [
  ...VENDORS.map((v) => ({ name: v.name, normalized_name: normalize(v.name), approved: true, is_demo: true })),
  { name: "Coastal Signs & Banners", normalized_name: normalize("Coastal Signs & Banners"), approved: false, is_demo: true },
];

// Self-check: the demo mix must be what the dashboard promises to show.
assert.ok(invoices.length >= 300 && invoices.length <= 500, `expected 300-500 invoices, got ${invoices.length}`);
for (const status of STATUSES) assert.ok(invoices.some((inv) => inv.status === status), `no ${status} invoices`);
for (const code of Object.keys(FLAG_LABELS)) assert.ok(invoices.some((inv) => (inv.flag_reasons as string[]).includes(code)), `no ${code} flags`);
for (const inv of invoices.filter((inv) => inv.status === "clean")) assert.ok(inv.total! <= APPROVAL_LIMIT, "clean invoice over limit");

const tally = Object.groupBy(invoices, (inv) => inv.status as string);
console.log(`${invoices.length} invoices:`, Object.fromEntries(Object.entries(tally).map(([k, v]) => [k, v!.length])));
console.log(`${vendorRows.length} vendors, ${purchaseOrders.size} purchase orders, ${runLog.length} runs, ${errorLog.length} errors.`);
const trend = Object.entries(Object.groupBy(invoices, (inv) => `weeks ${Math.floor((now - Date.parse(inv.created_at)) / (28 * DAY)) * 4}+ ago`))
  .map(([block, rows]) => `${block}: ${rows!.length} invoices, ${Math.round((100 * rows!.filter((r) => r.status === "clean").length) / rows!.length)}% clean`);
console.log(`Clean rate trend (oldest first):\n${trend.join("\n")}`);
if (process.argv.includes("--dry")) process.exit(0);

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Add SUPABASE_URL and SUPABASE_SECRET_KEY to .env.local first.");
  process.exit(1);
}
const db = createClient(url, secret, { auth: { persistSession: false } });

async function run(label: string, query: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
}

async function insert(table: string, rows: object[]) {
  for (let i = 0; i < rows.length; i += 200) await run(`insert ${table}`, db.from(table).insert(rows.slice(i, i + 200)));
}

for (const table of ["run_log", "error_log", "invoices", "purchase_orders", "vendors"]) {
  await run(`clear ${table}`, db.from(table).delete().eq("is_demo", true));
}
await insert("vendors", vendorRows);
await insert("purchase_orders", [...purchaseOrders.values()]);
await insert("invoices", invoices);
await insert("run_log", runLog);
await insert("error_log", errorLog);
console.log("Done. Demo data is in Supabase.");

