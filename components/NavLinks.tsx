"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/invoices", label: "Invoices" },
  { href: "/reports", label: "Reports" },
  { href: "/errors", label: "Errors" },
  { href: "/how-it-works", label: "How it works" },
];

// Client component only because it needs the current URL to highlight the active page.
export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto border-t border-line px-3 py-2 text-sm sm:mx-0 sm:ml-auto sm:w-auto sm:border-0 sm:p-0">
      {links.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${
              active ? "bg-fg/10 text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
