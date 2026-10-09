import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** A native select with the dashboard's input styling, as the client form's currency picker uses. */
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      {...props}
      className={cn(
        "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className,
      )}
    />
  );
}
