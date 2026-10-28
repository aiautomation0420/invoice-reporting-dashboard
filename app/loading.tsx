// Shown while the Overview loads.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading overview">
      <div className="h-12 w-64 rounded-lg bg-fg/5" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-fg/5" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-80 rounded-2xl bg-fg/5" />
        <div className="h-80 rounded-2xl bg-fg/5" />
      </div>
    </div>
  );
}
