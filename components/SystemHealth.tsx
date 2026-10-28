import Link from "next/link";
import { count, dateTime, timeAgo } from "@/lib/format";
import { Panel } from "./Panel";

export function SystemHealth({ runs, errors, lastRun, now }: { runs: number; errors: number; lastRun: string | null; now: number }) {
  const healthy = errors === 0;
  return (
    <Panel
      title="System health"
      subtitle="Last 7 days"
      action={
        <span className="flex items-center gap-1.5 text-xs">
          <span aria-hidden className={`size-2 rounded-full ${healthy ? "bg-clean" : "bg-flagged"}`} />
          {healthy ? "All good" : "Needs a look"}
        </span>
      }
    >
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Invoices processed</dt>
          <dd className="font-medium tabular-nums">{count(runs)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Workflow errors</dt>
          <dd className="font-medium tabular-nums">
            {errors > 0 ? (
              <Link href="/errors" className="underline decoration-line underline-offset-4 hover:decoration-fg">
                {count(errors)} · view
              </Link>
            ) : (
              "0"
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Last successful run</dt>
          <dd className="text-right font-medium" title={dateTime(lastRun)}>
            {lastRun ? timeAgo(lastRun, now) : "No runs yet"}
          </dd>
        </div>
      </dl>
    </Panel>
  );
}
