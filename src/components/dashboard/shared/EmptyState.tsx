import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  Icon,
  title,
  description,
  children,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="workspace-surface rounded-2xl border border-border bg-card px-6 py-12 sm:px-10 sm:py-16">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <span
          aria-hidden="true"
          className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-brand ring-1 ring-inset ring-primary/15"
        >
          <Icon className="size-6" />
        </span>
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
        <p className="mt-3 text-workspace-body leading-relaxed text-muted-foreground">{description}</p>
        {children && <div className="mt-7 flex flex-wrap justify-center gap-3">{children}</div>}
      </div>
    </div>
  );
}
