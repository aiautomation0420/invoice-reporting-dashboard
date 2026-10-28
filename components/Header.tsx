import Link from "next/link";
import { hasDemoData } from "@/lib/supabase";
import { NavLinks } from "./NavLinks";

export async function Header() {
  const demo = await hasDemoData();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4 sm:h-16 sm:flex-nowrap sm:px-6">
        <div className="flex h-14 items-center gap-3 sm:h-auto">
          <Link href="/" className="text-sm font-semibold tracking-tight text-fg">
            Invoice Reporting Dashboard
          </Link>
          {demo && (
            <span
              className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-muted"
              title="Showing seeded demo data, not real invoices"
            >
              Demo data
            </span>
          )}
        </div>
        <NavLinks />
      </div>
    </header>
  );
}
