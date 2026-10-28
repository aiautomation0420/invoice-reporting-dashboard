import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">This page doesn&apos;t exist. The link may be old or mistyped.</p>
      <Link href="/" className="mt-6 inline-flex rounded-full bg-fg px-5 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-80">
        Go to the overview
      </Link>
    </div>
  );
}
