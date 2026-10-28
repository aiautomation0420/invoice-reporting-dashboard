import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ERRORS_PAGE_SIZE, listErrors, type WorkflowError } from "@/lib/queries/errors";
import { count, dateTime, timeAgo } from "@/lib/format";
import { SHOW_PRIVATE_LINKS } from "@/lib/supabase";
import { LastUpdated } from "@/components/LastUpdated";
import { Pagination } from "@/components/Pagination";

export const metadata: Metadata = { title: "Errors" };
export const dynamic = "force-dynamic";

const href = (page: number) => (page > 1 ? `/errors?page=${page}` : "/errors");

// Run links reveal the n8n server address, so they only show when SHOW_PRIVATE_LINKS=true (local).
// Only plain https links: the value comes from the database, never trust it as a raw href.
function RunLink({ error }: { error: WorkflowError }) {
  if (!SHOW_PRIVATE_LINKS || !error.run_link?.startsWith("https://")) return null;
  return (
    <a href={error.run_link} target="_blank" rel="noreferrer" className="whitespace-nowrap underline decoration-line underline-offset-4 hover:decoration-fg">
      Open in n8n ↗
    </a>
  );
}

export default async function ErrorsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? "1", 10) || 1);
  const result = await listErrors(page);
  if (!result) redirect(href(1));
  const { rows, total, lastWeek } = result;
  const now = Date.now();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workflow errors</h1>
        <p className="mt-1 text-sm text-muted">
          Times the n8n workflow itself failed (not invoices that failed a check).{" "}
          {total > 0 && (
            <>
              <span className="font-medium text-fg">{count(lastWeek)}</span> in the last 7 days, {count(total)} in total.
            </>
          )}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
          No errors logged. The workflow has been running cleanly.
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Workflow</th>
                  <th className="px-5 py-3 font-medium">Failed step</th>
                  <th className="px-5 py-3 font-medium">Message</th>
                  {SHOW_PRIVATE_LINKS && <th className="px-5 py-3 font-medium">Run</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line align-top">
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-3 whitespace-nowrap tabular-nums">
                      {dateTime(e.created_at)}
                      <span className="block text-xs text-muted">{timeAgo(e.created_at, now)}</span>
                    </td>
                    <td className="px-5 py-3 text-muted">{e.workflow ?? "—"}</td>
                    <td className="px-5 py-3 font-medium">{e.node ?? "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs break-words">{e.message ?? "—"}</td>
                    {SHOW_PRIVATE_LINKS && <td className="px-5 py-3"><RunLink error={e} /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone: cards */}
          <ul className="space-y-3 md:hidden">
            {rows.map((e) => (
              <li key={e.id} className="rounded-2xl border border-line bg-surface p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{e.node ?? "Unknown step"}</p>
                  <p className="text-xs whitespace-nowrap text-muted">{timeAgo(e.created_at, now)}</p>
                </div>
                <p className="mt-1 text-xs text-muted">{e.workflow ?? "—"} · {dateTime(e.created_at)}</p>
                <p className="mt-3 font-mono text-xs break-words">{e.message ?? "—"}</p>
                {SHOW_PRIVATE_LINKS && <p className="mt-3 text-xs"><RunLink error={e} /></p>}
              </li>
            ))}
          </ul>

          <Pagination page={page} pageSize={ERRORS_PAGE_SIZE} total={total} hrefFor={href} />
        </>
      )}

      <LastUpdated at={new Date(now).toISOString()} />
    </div>
  );
}
