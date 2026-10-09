import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "info" | "success" | "danger" | "brand";

const TONES: Record<StatusTone, string> = {
  neutral: "bg-neutral-soft text-muted-foreground",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  brand: "bg-primary/10 text-brand ring-1 ring-inset ring-primary/15",
};

/** A status as text. The label carries the meaning; the tone only reinforces it. */
export function StatusBadge({ label, tone = "neutral", className }: { label: string; tone?: StatusTone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-workspace-sm font-medium",
        TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
