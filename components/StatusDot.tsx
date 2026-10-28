import type { Status } from "@/lib/config";

const colors: Record<Status, string> = {
  clean: "bg-clean",
  flagged: "bg-flagged",
  approved: "bg-approved",
  rejected: "bg-rejected",
};

export function StatusDot({ status }: { status: Status }) {
  return <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full ${colors[status]}`} />;
}
