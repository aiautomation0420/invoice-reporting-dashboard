// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { buckets, mathIssues, metrics, summarize, toCsv, topVendors, type InvoiceRow } from "./report.ts";
import { dateKey, dayStart, parseDateKey, parseWeekKey, weekStart } from "./week.ts";

const row = (status: InvoiceRow["status"], total: number | null, flags: string[] = [], created_at = "2026-10-20T00:00:00Z", vendor: string | null = "Acme"): InvoiceRow => ({
  status,
  total,
  flag_reasons: flags,
  created_at,
  vendor,
});

test("weeks start Monday 00:00 Manila time", () => {
  const monday = Date.parse("2026-10-25T16:00:00Z"); // Mon Oct 26, 00:00 in Manila
  assert.equal(weekStart(Date.parse("2026-10-28T03:00:00Z")), monday);
  assert.equal(weekStart(monday), monday);
  assert.equal(dateKey(weekStart(Date.parse("2026-10-25T15:59:00Z"))), "2026-10-19"); // Sun 23:59 Manila
  assert.equal(dateKey(monday), "2026-10-26");
  assert.equal(parseWeekKey("2026-10-26"), monday);
  assert.equal(parseWeekKey("2026-10-27"), null); // not a Monday
  assert.equal(parseWeekKey("nonsense"), null);
  assert.equal(parseDateKey("2026-10-27"), Date.parse("2026-10-26T16:00:00Z"));
  assert.equal(parseDateKey("2026-02-31"), null);
  assert.equal(dateKey(dayStart(Date.parse("2026-10-27T16:30:00Z"))), "2026-10-28"); // 00:30 Manila
});

test("summary counts statuses, flags and money", () => {
  const s = summarize([
    row("clean", 100),
    row("clean", 50),
    row("approved", 200, ["po_mismatch"]),
    row("rejected", 999, ["duplicate", "po_mismatch"]),
    row("flagged", null, ["unreadable_file"]),
  ]);
  assert.equal(s.processed, 5);
  assert.equal(s.clean, 2);
  assert.equal(s.cleanRate, 0.4);
  assert.equal(s.flagRate, 0.6); // approved + rejected + flagged
  assert.equal(s.amount, 350); // rejected and unreadable excluded
  assert.equal(s.minutesSaved, 30);
  assert.deepEqual(s.flags[0], { code: "po_mismatch", count: 2 });

  const rate = metrics(s, summarize([row("clean", 1), row("flagged", 1, ["duplicate"])])).find((m) => m.label === "Clean rate")!;
  assert.equal(rate.change, "-10 pts");
});

test("csv escapes commas and quotes", () => {
  assert.equal(toCsv([["a,b", 'say "hi"', 3]]), '"a,b","say ""hi""",3');
});

test("chart buckets include empty weeks and split clean vs flagged", () => {
  const from = Date.parse("2026-10-12T00:00:00Z"); // inside week of Oct 12
  const to = Date.parse("2026-10-28T00:00:00Z");
  const b = buckets(
    [row("clean", 100, [], "2026-10-13T02:00:00Z"), row("rejected", 50, ["duplicate"], "2026-10-27T02:00:00Z"), row("approved", 20, ["po_mismatch"], "2026-10-27T03:00:00Z")],
    "week",
    from,
    to,
  );
  assert.deepEqual(b.map((x) => x.key), ["2026-10-12", "2026-10-19", "2026-10-26"]);
  assert.deepEqual(b.map((x) => [x.clean, x.flagged, x.amount]), [[1, 0, 100], [0, 0, 0], [0, 2, 20]]);
});

test("top vendors by amount, skipping rejected and unknown", () => {
  const v = topVendors([row("clean", 10, [], undefined, "A"), row("clean", 30, [], undefined, "B"), row("approved", 5, [], undefined, "A"), row("rejected", 999, [], undefined, "C"), row("flagged", null, [], undefined, null)], 5);
  assert.deepEqual(v, [{ vendor: "B", amount: 30, invoices: 1 }, { vendor: "A", amount: 15, invoices: 2 }]);
});

test("math check explains what doesn't add up", () => {
  const ok = { line_items: [{ amount: 100 }, { amount: 50 }], subtotal: 150, tax: 12.38, total: 162.38, currency: "USD" };
  assert.deepEqual(mathIssues(ok), []);
  assert.deepEqual(mathIssues({ ...ok, total: 200 }), ["Subtotal + tax = $162.38, but the total says $200.00."]);
  assert.equal(mathIssues({ ...ok, subtotal: 140, total: 152.38 }).length, 1); // lines 150 vs subtotal 140
  assert.deepEqual(mathIssues({ line_items: [], subtotal: null, tax: null, total: null, currency: null }), []);
});
