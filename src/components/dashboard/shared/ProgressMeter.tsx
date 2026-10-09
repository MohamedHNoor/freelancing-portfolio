/** A labelled progress bar for a whole percentage, with the value as visible text. */
export function ProgressMeter({ id, label, value, detail }: { id: string; label: string; value: number; detail?: string }) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <span id={`${id}-label`} className="text-workspace-body font-medium">{label}</span>
        <span className="font-mono text-workspace-body tabular-nums">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-labelledby={`${id}-label`}
        aria-describedby={detail ? `${id}-detail` : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      {detail && <p id={`${id}-detail`} className="text-workspace-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}
