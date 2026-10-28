import { getWeeklyReport } from "@/lib/queries/reports";
import { reportCsv } from "@/lib/report";

// GET /reports/csv?week=2026-10-19 downloads that week's report. Read-only.
export async function GET(request: Request) {
  try {
    const report = await getWeeklyReport(new URL(request.url).searchParams.get("week"));
    return new Response(reportCsv(report.key, report.current, report.previous), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="invoice-report-${report.key}.csv"`,
      },
    });
  } catch {
    return new Response("Could not load the report right now. Please try again in a moment.", { status: 503 });
  }
}
