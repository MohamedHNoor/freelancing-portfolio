export default function ClientsLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading clients…</span>
      <div aria-hidden="true" className="space-y-8 motion-safe:animate-pulse">
        <div className="space-y-3">
          <div className="h-8 w-36 rounded bg-muted" />
          <div className="h-4 w-full max-w-md rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-20 rounded-lg bg-muted" />
          <div className="h-11 w-24 rounded-lg bg-muted" />
        </div>
        <div className="space-y-px overflow-hidden rounded-xl border border-border bg-card">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex gap-6 px-4 py-4">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-4 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
