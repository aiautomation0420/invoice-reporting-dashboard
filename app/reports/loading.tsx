// Shown while the report loads.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Loading report">
      <div className="h-12 w-64 rounded-lg bg-fg/5" />
      <div className="h-96 rounded-2xl bg-fg/5" />
      <div className="h-48 rounded-2xl bg-fg/5" />
    </div>
  );
}
