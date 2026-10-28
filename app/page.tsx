import { getOverview, parseRange, RANGES } from "@/lib/queries/overview";
import { change, count, flagLabel, hours, money, percent, pointsChange } from "@/lib/format";
import { AmountChart, Legend, VolumeChart } from "@/components/Charts";
import { BarList } from "@/components/BarList";
import { LastUpdated } from "@/components/LastUpdated";
import { Panel } from "@/components/Panel";
import { RangeFilter } from "@/components/RangeFilter";
import { StatCard } from "@/components/StatCard";
import { SystemHealth } from "@/components/SystemHealth";

export const dynamic = "force-dynamic";

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = parseRange((await searchParams).range);
  const { summary: s, previous: p, series, bucketSize, vendors, health, generatedAt } = await getOverview(range);
  const days = RANGES[range];
  const compare = days ? `vs previous ${days} days` : undefined;
  const delta = (key: "processed" | "flagged" | "approved" | "rejected" | "amount" | "minutesSaved") => (p ? change(s[key], p[key]) : null);
  const per = bucketSize === "week" ? "week" : "day";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted">Invoice processing at a glance, {days ? `last ${days} days` : "all time"}.</p>
        </div>
        <RangeFilter value={range} />
      </div>

      {s.processed === 0 && (
        <p className="rounded-2xl border border-dashed border-line px-5 py-4 text-sm text-muted">
          No invoices yet in this period. They will appear here as soon as the n8n agent processes one.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Invoices processed" value={count(s.processed)} change={delta("processed")} compareLabel={compare} />
        <StatCard
          label="Clean rate"
          value={percent(s.cleanRate)}
          change={p?.processed ? pointsChange(s.cleanRate, p.cleanRate) : null}
          compareLabel={compare}
        />
        <StatCard label="Total amount" value={money(s.amount)} change={delta("amount")} compareLabel={compare} />
        <StatCard label="Hours saved" value={hours(s.minutesSaved)} change={delta("minutesSaved")} compareLabel={compare} />
      </div>
      {/* On phones the odd third card spans the full row. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        <StatCard label="Flagged, awaiting review" status="flagged" value={count(s.flagged)} change={delta("flagged")} compareLabel={compare} />
        <StatCard label="Approved after review" status="approved" value={count(s.approved)} change={delta("approved")} compareLabel={compare} />
        <StatCard label="Rejected" status="rejected" value={count(s.rejected)} change={delta("rejected")} compareLabel={compare} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title={`Invoices per ${per}`}
          subtitle="Clean vs flagged by the bookkeeper checks"
          action={<Legend items={[{ label: "Clean", color: "var(--clean)" }, { label: "Flagged", color: "var(--flagged)" }]} />}
        >
          <VolumeChart data={series} size={bucketSize} />
        </Panel>
        <Panel title={`Amount processed per ${per}`} subtitle="Invoice totals, excluding rejected">
          <AmountChart data={series} size={bucketSize} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Top flag reasons" subtitle="How often each check failed">
          {s.flags.length ? (
            <BarList barClass="bg-flagged" items={s.flags.map((f) => ({ label: flagLabel(f.code), value: f.count, display: count(f.count) }))} />
          ) : (
            <p className="text-sm text-muted">No flags in this period.</p>
          )}
        </Panel>
        <Panel title="Top vendors by amount" subtitle="Excluding rejected invoices">
          {vendors.length ? (
            <BarList
              barClass="bg-muted"
              items={vendors.map((v) => ({ label: v.vendor, value: v.amount, display: money(v.amount), note: `${v.invoices} inv.` }))}
            />
          ) : (
            <p className="text-sm text-muted">No vendors in this period.</p>
          )}
        </Panel>
        <SystemHealth {...health} now={Date.parse(generatedAt)} />
      </div>

      <LastUpdated at={generatedAt} />
    </div>
  );
}
