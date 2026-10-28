import type { Status } from "@/lib/config";
import { StatusDot } from "./StatusDot";

const labels: Record<Status, string> = { clean: "Clean", flagged: "Flagged", approved: "Approved", rejected: "Rejected" };
const tints: Record<Status, string> = {
  clean: "bg-clean/10 border-clean/30",
  flagged: "bg-flagged/10 border-flagged/30",
  approved: "bg-approved/10 border-approved/30",
  rejected: "bg-rejected/10 border-rejected/30",
};

// Text stays in the normal text color; the dot and tint carry the status color, so the word is always readable.
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${tints[status] ?? "border-line"}`}>
      <StatusDot status={status} />
      {labels[status] ?? status}
    </span>
  );
}
