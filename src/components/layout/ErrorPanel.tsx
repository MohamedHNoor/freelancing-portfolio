import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Receives only a retry function, keeping raw server errors out of the UI. */
export function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-border bg-card px-6 py-10 text-center sm:px-10">
      <TriangleAlertIcon className="mx-auto mb-5 size-8 text-muted-foreground" aria-hidden="true" />
      <h1 id="error-heading" className="font-heading text-workspace-title font-semibold">
        Unable to load this page
      </h1>
      <p className="mt-3 text-workspace-body leading-relaxed text-muted-foreground">
        Something went wrong. Please try again in a moment.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={onRetry} className="min-h-11 px-4">
          Try again
        </Button>
        <Button asChild variant="outline" className="min-h-11 px-4">
          <Link href="/" prefetch={false}>Back to portfolio</Link>
        </Button>
      </div>
    </div>
  );
}
