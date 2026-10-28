"use client";

// The two time charts on the Overview. Client-side because Recharts draws in the browser.
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { count, money, moneyShort, shortDate } from "@/lib/format";

export type Point = { key: string; clean: number; flagged: number; amount: number };
type Size = "day" | "week";

const axisProps = { tickLine: false, axisLine: false, tick: { fill: "var(--muted)", fontSize: 12 } } as const;
const periodLabel = (key: string, size: Size) => (size === "week" ? `Week of ${shortDate(key)}` : shortDate(key));

function Frame({ children, label, head, rows }: { children: React.ReactElement; label: string; head: string[]; rows: string[][] }) {
  return (
    <>
      {/* Fixed height so the page doesn't jump while the chart loads. */}
      <div className="h-60" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      {/* The same numbers as a table, for screen readers. */}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function TooltipBox({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-muted tabular-nums">
          {r.color && <span className="size-2 rounded-full" style={{ background: r.color }} />}
          {r.label}
          <span className="ml-auto pl-4 font-medium text-fg">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex gap-4 text-xs text-muted">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export function VolumeChart({ data, size }: { data: Point[]; size: Size }) {
  return (
    <Frame
      label={`Invoices per ${size}, clean vs flagged`}
      head={[size === "week" ? "Week" : "Day", "Clean", "Flagged by checks"]}
      rows={data.map((p) => [periodLabel(p.key, size), count(p.clean), count(p.flagged)])}
    >
      <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="key" tickFormatter={shortDate} {...axisProps} minTickGap={16} />
        <YAxis allowDecimals={false} {...axisProps} />
        <Tooltip
          cursor={{ fill: "var(--line)" }}
          content={({ active, payload }) => {
            const p = active && (payload?.[0]?.payload as Point | undefined);
            if (!p) return null;
            return (
              <TooltipBox
                title={periodLabel(p.key, size)}
                rows={[
                  { label: "Clean", value: count(p.clean), color: "var(--clean)" },
                  { label: "Flagged by checks", value: count(p.flagged), color: "var(--flagged)" },
                  { label: "Total", value: count(p.clean + p.flagged) },
                ]}
              />
            );
          }}
        />
        {/* No animation: the page refreshes every minute and bars would regrow each time. Surface-colored stroke = 2px gap between segments. */}
        <Bar isAnimationActive={false} dataKey="clean" stackId="a" fill="var(--clean)" stroke="var(--surface)" strokeWidth={2} />
        <Bar isAnimationActive={false} dataKey="flagged" stackId="a" fill="var(--flagged)" stroke="var(--surface)" strokeWidth={2} radius={[4, 4, 0, 0]} />
      </BarChart>
    </Frame>
  );
}

export function AmountChart({ data, size }: { data: Point[]; size: Size }) {
  return (
    <Frame
      label={`Amount processed per ${size}`}
      head={[size === "week" ? "Week" : "Day", "Amount"]}
      rows={data.map((p) => [periodLabel(p.key, size), money(p.amount)])}
    >
      <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="key" tickFormatter={shortDate} {...axisProps} minTickGap={16} />
        <YAxis tickFormatter={(v: number) => moneyShort(v)} {...axisProps} width={56} />
        <Tooltip
          cursor={{ fill: "var(--line)" }}
          content={({ active, payload }) => {
            const p = active && (payload?.[0]?.payload as Point | undefined);
            if (!p) return null;
            return <TooltipBox title={periodLabel(p.key, size)} rows={[{ label: "Amount (excl. rejected)", value: money(p.amount) }]} />;
          }}
        />
        {/* Neutral gray: status colors are kept for statuses only. */}
        <Bar isAnimationActive={false} dataKey="amount" fill="var(--muted)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </Frame>
  );
}
