import { FLAG_LABELS } from "@/lib/config";
import { StatusDot } from "./StatusDot";

const checkCount = Object.keys(FLAG_LABELS).length;

const steps = [
  { title: "Receive", body: "An invoice arrives as a Gmail attachment or is dropped into a watched Google Drive folder." },
  { title: "Read", body: "The text is pulled from the file, then AI (via OpenRouter) extracts the vendor, invoice number, dates, PO, line items and totals." },
  { title: "Check", body: `The vendor is matched to the approved list, then ${checkCount} bookkeeper checks run: math, duplicates, PO, approval limit, dates, missing fields, AI confidence and more.` },
  { title: "Save", body: "The result is saved to Supabase with a status and the reasons for any flag. Later this step can be swapped for QuickBooks “Create Bill”." },
];

const box = "rounded-xl border border-line bg-surface p-4";

/** Between steps: down on phones, right on desktop. `down` = always down (between rows). */
function Arrow({ down = false }: { down?: boolean }) {
  return (
    <div aria-hidden className="flex items-center justify-center text-muted">
      <span className={down ? "" : "lg:hidden"}>↓</span>
      {!down && <span className="hidden lg:inline">→</span>}
    </div>
  );
}

/** The invoice agent's flow in plain HTML: left to right on desktop, top to bottom on phones. */
export function FlowDiagram() {
  return (
    <figure className="space-y-3">
      <ol className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
        {steps.map((step, i) => (
          <li key={step.title} className="contents">
            {i > 0 && <Arrow />}
            <div className={`${box} lg:flex-1`}>
              <p className="text-xs text-muted tabular-nums">Step {i + 1}</p>
              <p className="mt-1 text-sm font-semibold">{step.title}</p>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <Arrow down />

      <div className="grid gap-2 sm:grid-cols-2">
        <div className={box}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <StatusDot status="clean" /> All checks pass → Clean
          </p>
          <p className="mt-1 text-sm text-muted">Ready to pay. No person needs to touch it.</p>
        </div>
        <div className={box}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <StatusDot status="flagged" /> Any check fails → Flagged
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
            A reviewer gets an email with Approve and Reject buttons and marks it
            <span className="inline-flex items-center gap-1.5"><StatusDot status="approved" /> Approved</span> or
            <span className="inline-flex items-center gap-1.5"><StatusDot status="rejected" /> Rejected</span>
          </p>
        </div>
      </div>

      <Arrow down />

      <div className={`${box} text-sm`}>
        <p className="font-semibold">Reported</p>
        <p className="mt-1 text-muted">On this dashboard (refreshed every minute) and in a weekly email report that uses the same numbers.</p>
      </div>

      <div className="rounded-xl border border-dashed border-line p-4 text-sm">
        <p className="font-semibold">If a step itself fails</p>
        <p className="mt-1 text-muted">
          The Crash Alert workflow (an n8n Error Trigger) records which step failed, the error message and a link to the run, and emails
          an alert. It shows up on the Errors page and in System health.
        </p>
      </div>
      <figcaption className="sr-only">
        Flow of the invoice agent: receive from Gmail or Google Drive, read with AI, check, save. Clean invoices are done; flagged invoices
        go to a reviewer by email, who approves or rejects them. Everything is reported on the dashboard and in a weekly email. Workflow
        failures are logged to the Errors page and emailed as an alert.
      </figcaption>
    </figure>
  );
}
