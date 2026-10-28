"use client";

import { useRouter } from "next/navigation";
import { weekLabel } from "@/lib/format";

export function WeekPicker({ weeks, value }: { weeks: { key: string; current: boolean }[]; value: string }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Week</span>
      <select
        value={value}
        onChange={(e) => router.push(`/reports?week=${e.target.value}`)}
        className="h-10 cursor-pointer rounded-full border border-line bg-surface px-4 text-fg"
      >
        {weeks.map((w) => (
          <option key={w.key} value={w.key}>
            {weekLabel(w.key)}
            {w.current ? " (so far)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
