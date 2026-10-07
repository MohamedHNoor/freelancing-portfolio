"use client";

import { ErrorPanel } from "@/components/layout/ErrorPanel";
import { SkipLink } from "@/components/layout/SkipLink";

export default function RootError({ retry }: {
  error: unknown;
  reset: () => void;
  retry: () => void;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <main
        id="main-content"
        tabIndex={-1}
        aria-labelledby="error-heading"
        className="flex min-h-dvh items-center justify-center px-5 py-10 outline-none"
      >
        <ErrorPanel onRetry={retry} />
      </main>
    </div>
  );
}
