import { PORTFOLIO_URL } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
        <p>Read-only reporting for the AI Invoice Processing &amp; Audit Agent (n8n + Supabase).</p>
        <a href={PORTFOLIO_URL} className="transition-colors hover:text-fg">
          Built by Lovergil Perillo · Portfolio →
        </a>
      </div>
    </footer>
  );
}
