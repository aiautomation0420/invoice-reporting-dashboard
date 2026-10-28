import type { Metadata } from "next";
import { getWeeklyReport } from "@/lib/queries/reports";
import { flagRows, metrics } from "@/lib/report";
import { count, weekLabel } from "@/lib/format";
import { LastUpdated } from "@/components/LastUpdated";
import { StatusDot } from "@/components/StatusDot";
import { WeekPicker } from "@/components/WeekPicker";
import { BarList } from "@/components/BarList";
import { Panel } from "@/components/Panel";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const report = await getWeeklyReport((await searchParams).week);
  const rows = metrics(report.current, report.previous);
  const flags = flagRows(report.current, report.previous);
  const empty = report.current.processed === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Weekly report</h1>
          <p className="mt-1 text-sm text-muted">
            {weekLabel(report.key)}
            {report.isCurrentWeek ? " (week in progress)" : ""} · compared with the week before
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WeekPicker weeks={report.weeks} value={report.key} />
          <a
            href={`/reports/csv?week=${report.key}`}
            download
            className="inline-flex h-10 items-center rounded-full bg-fg px-5 text-sm font-medium text-bg transition-opacity hover:opacity-80"
          >
            Download CSV
          </a>
        </div>
      </div>

      {empty && (
        <p className="rounded-2xl border border-dashed border-line px-5 py-4 text-sm text-muted">
          No invoices were processed this week. Pick another week above.
        </p>
      )}

      <section className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-medium">Metric</th>
              <th className="px-5 py-3 text-right font-medium">This week</th>
              <th className="px-5 py-3 text-right font-medium">Last week</th>
              <th className="px-5 py-3 text-right font-medium">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line tabular-nums">
            {rows.map((m) => (
              <tr key={m.label}>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2">
                    {m.status && <StatusDot status={m.status} />}
                    {m.label}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-medium">{m.now}</td>
                <td className="px-5 py-3 text-right text-muted">{m.before}</td>
                <td className="px-5 py-3 text-right text-muted">{m.change ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Panel title="Top flag reasons">
        {flags.length === 0 ? (
          <p className="text-sm text-muted">No invoices were flagged in these two weeks.</p>
        ) : (
          <BarList
            barClass="bg-flagged"
            items={flags.map((f) => ({ label: f.label, value: f.now, display: count(f.now), note: `last week ${count(f.before)}` }))}
          />
        )}
      </Panel>

      <LastUpdated at={report.generatedAt} />
    </div>
  );
}
