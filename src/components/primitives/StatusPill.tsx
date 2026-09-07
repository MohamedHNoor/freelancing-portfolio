import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/types/content";

/* Meaning lives in the label text. Tone and dot style reinforce it but never
   carry it alone, so the pill still reads correctly in greyscale and to anyone
   who cannot distinguish the accent from the muted tone. */
const STATUS_PRESENTATION: Record<
  AvailabilityStatus,
  { label: string; pill: string; dot: string }
> = {
  available: {
    label: "Available for work",
    pill: "border-brand/40 bg-brand/10 text-brand",
    dot: "bg-brand",
  },
  limited: {
    label: "Limited availability",
    pill: "border-input bg-muted text-foreground",
    dot: "bg-transparent ring-2 ring-inset ring-foreground",
  },
  unavailable: {
    label: "Not taking new work",
    pill: "border-input bg-muted text-muted-foreground",
    dot: "bg-transparent ring-1 ring-inset ring-muted-foreground",
  },
};

type StatusPillProps = {
  status: AvailabilityStatus;
  className?: string;
};

export function StatusPill({ status, className }: StatusPillProps) {
  const { label, pill, dot } = STATUS_PRESENTATION[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        pill,
        className,
      )}
    >
      <span className={cn("size-2 shrink-0 rounded-full", dot)} aria-hidden="true" />
      {label}
    </span>
  );
}
