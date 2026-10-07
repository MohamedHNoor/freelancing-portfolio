export default function DashboardLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading dashboard…</span>
      <div aria-hidden="true" className="space-y-8 motion-safe:animate-pulse">
        <div className="space-y-3">
          <div className="h-3 w-36 rounded bg-muted" />
          <div className="h-8 w-44 rounded bg-muted" />
          <div className="h-4 w-full max-w-md rounded bg-muted" />
        </div>
        <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card px-6 py-12">
          <div className="size-16 rounded-2xl bg-muted" />
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-4 w-full max-w-sm rounded bg-muted" />
          <div className="h-4 w-full max-w-xs rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
