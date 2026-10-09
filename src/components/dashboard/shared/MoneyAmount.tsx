import { cn } from "@/lib/utils";

/** An amount already formatted on the server, in tabular figures so columns line up. */
export function MoneyAmount({ value, className }: { value: string; className?: string }) {
  return <span className={cn("font-mono tabular-nums whitespace-nowrap", className)}>{value}</span>;
}
