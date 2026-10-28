import type { Metadata } from "next";
import { APPROVAL_LIMIT, FLAG_HELP, FLAG_LABELS, MINUTES_PER_INVOICE, PORTFOLIO_URL, TIME_ZONE } from "@/lib/config";
import { count, hours, money } from "@/lib/format";
import { db } from "@/lib/supabase";
import { FlowDiagram } from "@/components/FlowDiagram";

export const metadata: Metadata = { title: "How it works" };
export const revalidate = 60; // keeps the live numbers and the header's "Demo data" label current

// Keep in sync with "Report definitions" in README.md (the n8n weekly email uses the same rules).
const definitions: [string, string][] = [
  ["Week", `Monday 00:00 to Sunday 23:59, ${TIME_ZONE} time. An invoice belongs to the week it was processed (created_at), not its invoice date.`],
  ["Invoices processed", "Every invoice the agent handled in the period, whatever its status, including files it could not read."],
  ["Clean", "Passed every bookkeeper check. No person needed to look at it."],
  ["Flagged (awaiting review)", "Failed at least one check and is still waiting for a person to decide."],
  ["Approved after review", "Was flagged, then a person approved it."],
  ["Rejected", "Was flagged, then a person rejected it (for example a duplicate)."],
  ["Clean rate", "Clean ÷ invoices processed."],
  ["Flag rate", "(Flagged + approved + rejected) ÷ invoices processed: every invoice that failed a check at any point. Unlike the status counts, it does not change after reviews."],
  ["Total amount", "Sum of invoice totals, leaving out rejected invoices (they will not be paid). Invoices with no readable total count as $0."],
  ["Hours saved", `Invoices processed × ${MINUTES_PER_INVOICE} minutes ÷ 60. See “How hours saved is calculated” above.`],
  ["Top flag reasons", "How often each check failed. An invoice with two problems counts once for each, so the reasons can add up to more than the flagged invoices."],
  ["Change vs last week", "(This week − last week) ÷ last week, rounded to a whole percent. Shown as “—” when last week was 0. Rates show the difference in percentage points instead (62% → 65% is “+3 pts”)."],
];

/** Total invoices so far, for the live hours-saved example. Null if the database can't be reached. */
async function invoicesSoFar() {
  try {
    const { count: total, error } = await db().from("invoices").select("id", { count: "exact", head: true });
    return error ? null : (total ?? 0);
  } catch {
    return null;
  }
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function HowItWorksPage() {
  const total = await invoicesSoFar();

  return (
    <div className="max-w-4xl space-y-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">How it works</h1>
        <p className="mt-2 max-w-2xl text-muted">
          The <span className="text-fg">AI Invoice Processing &amp; Audit Agent</span> is an n8n workflow that does an accounts-payable
          clerk&apos;s first pass: it reads each incoming invoice, checks it the way a bookkeeper would, and only sends the problem ones
          to a person. This dashboard shows what it did, so an AP manager can see the whole picture at a glance.
        </p>
      </div>

      <Section id="flow" title="The flow">
        <FlowDiagram />
      </Section>

      <Section id="checks" title="The bookkeeper checks">
        <p className="mb-4 text-sm text-muted">
          Every invoice goes through all {Object.keys(FLAG_LABELS).length}. Failing any one of them flags the invoice and emails a
          reviewer with Approve and Reject buttons. Nothing that looks wrong is approved automatically.
        </p>
        <dl className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {Object.entries(FLAG_LABELS).map(([code, label]) => (
            <div key={code} className="grid gap-1 px-5 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6">
              <dt className="text-sm font-medium">{label}</dt>
              <dd className="text-sm text-muted">{FLAG_HELP[code]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">Approval limit: {money(APPROVAL_LIMIT)}. Math is checked to the cent.</p>
        <p className="mt-4 text-sm text-muted">
          <span className="text-fg">Where invoices come from:</span> attachments in a Gmail inbox and files dropped into a Google Drive
          folder. <span className="text-fg">Where they go:</span> Supabase today. The save step is built so it can be swapped for
          QuickBooks &ldquo;Create Bill&rdquo; later, without changing the checks.
        </p>
      </Section>

      <Section id="errors" title="Error handling">
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted marker:text-line">
          <li>
            <span className="text-fg">Unreadable files are never dropped.</span> They are saved and flagged &ldquo;Could not read file&rdquo;,
            so a person sees every invoice that came in.
          </li>
          <li>
            <span className="text-fg">When in doubt, a person decides.</span> Any failed check, including a low AI confidence score, means
            the invoice waits for a reviewer&apos;s Approve or Reject instead of being approved.
          </li>
          <li>
            <span className="text-fg">Workflow failures are logged and emailed.</span> If a step breaks (an expired login, a timeout, a
            bad AI response), the Crash Alert workflow (an n8n Error Trigger) records the step, the message and a link to the run, and
            sends an alert email. They appear on the Errors page, and System health on the Overview turns amber.
          </li>
          <li>
            <span className="text-fg">This dashboard is read-only.</span> It reads the database on the server with a read-only key and
            has no buttons that change data.
          </li>
        </ul>
      </Section>

      <Section id="hours-saved" title="How hours saved is calculated">
        <div className="space-y-3 text-sm text-muted">
          <p>
            Each processed invoice counts as <span className="font-medium text-fg">{MINUTES_PER_INVOICE} minutes</span> of manual work
            saved: opening the file, typing the details into a spreadsheet or accounting system, checking the math, and matching the
            vendor and PO.
          </p>
          <p>
            This is an <span className="text-fg">estimate, not a measurement</span>. Flagged invoices still need a person to review them,
            and that review time is not subtracted, so for those invoices the real saving is smaller.
          </p>
          {total != null && (
            <p className="rounded-xl border border-line bg-surface px-4 py-3 tabular-nums text-fg">
              So far: {count(total)} invoices × {MINUTES_PER_INVOICE} min = <span className="font-semibold">{hours(total * MINUTES_PER_INVOICE)}</span> saved.
            </p>
          )}
        </div>
      </Section>

      <Section id="definitions" title="Report definitions">
        <p className="mb-4 text-sm text-muted">How every number on this dashboard is calculated. The weekly email report uses the same rules.</p>
        <dl className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {definitions.map(([term, meaning]) => (
            <div key={term} className="grid gap-1 px-5 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6">
              <dt className="text-sm font-medium">{term}</dt>
              <dd className="text-sm text-muted">{meaning}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-muted">
          Statuses change when someone reviews an invoice, so an older week can later move invoices from Flagged to Approved or
          Rejected. Invoices processed, flag rate and hours saved stay the same.
        </p>
      </Section>

      <div className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Built by Lovergil Perillo</p>
          <p className="mt-1 text-sm text-muted">AI automation with n8n, Supabase and Next.js. See more projects on my portfolio.</p>
        </div>
        <a href={PORTFOLIO_URL} className="inline-flex items-center rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-80">
          View portfolio →
        </a>
      </div>
    </div>
  );
}
