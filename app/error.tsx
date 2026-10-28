"use client";

// Shown instead of a crash when a page fails, for example when Supabase can't be reached.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
      <h1 className="text-lg font-semibold">Can&apos;t load the data right now</h1>
      <p className="mt-2 text-sm text-muted">
        The database didn&apos;t respond. This is usually temporary. Try again in a moment.
      </p>
      <button
        onClick={reset}
        className="mt-6 cursor-pointer rounded-full bg-fg px-5 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-80"
      >
        Try again
      </button>
    </div>
  );
}
