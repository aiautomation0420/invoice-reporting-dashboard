import { scoped } from "@/lib/supabase";
import { DAY } from "@/lib/week";

export const ERRORS_PAGE_SIZE = 25;

export type WorkflowError = { id: string; workflow: string | null; node: string | null; message: string | null; run_link: string | null; created_at: string };

/** One page of workflow errors (newest first) plus how many happened in the last 7 days. Null if the page is past the end. */
export async function listErrors(page: number) {
  const start = (page - 1) * ERRORS_PAGE_SIZE;
  const [list, recent] = await Promise.all([
    scoped("error_log", "id, workflow, node, message, run_link, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(start, start + ERRORS_PAGE_SIZE - 1),
    scoped("error_log", "id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * DAY).toISOString()),
  ]);
  if (list.error?.code === "PGRST103") return null;
  if (list.error) throw new Error(list.error.message);
  if (recent.error) throw new Error(recent.error.message);
  return { rows: list.data as unknown as WorkflowError[], total: list.count ?? 0, lastWeek: recent.count ?? 0 };
}
