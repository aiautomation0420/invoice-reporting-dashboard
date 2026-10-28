// Shown while the error log loads.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading errors">
      <div className="h-12 w-64 rounded-lg bg-fg/5" />
      <div className="h-96 rounded-2xl bg-fg/5" />
    </div>
  );
}
