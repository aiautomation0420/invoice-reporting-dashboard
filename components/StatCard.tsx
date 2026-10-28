import type { Status } from "@/lib/config";
import { StatusDot } from "./StatusDot";

/** One number card: label, big value, and the change vs the previous period. */
export function StatCard({
  label,
  value,
  change,
  compareLabel,
  status,
}: {
  label: string;
  value: string;
  change?: string | null;
  compareLabel?: string;
  status?: Status;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="flex items-center gap-2 text-xs text-muted">
        {status && <StatusDot status={status} />}
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
      {compareLabel && (
        <p className="mt-1 text-xs text-muted tabular-nums">
          {/* "—" when the previous value was 0, same rule as the Reports page. */}
          <span className="font-medium text-fg">{change ?? "—"}</span> {compareLabel}
        </p>
      )}
    </div>
  );
}
