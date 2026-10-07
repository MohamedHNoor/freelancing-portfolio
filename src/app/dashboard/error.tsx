"use client";

import { ErrorPanel } from "@/components/layout/ErrorPanel";

export default function DashboardError({ retry }: {
  error: unknown;
  reset: () => void;
  retry: () => void;
}) {
  // This boundary catches page failures. The root boundary catches layout failures.
  return <ErrorPanel onRetry={retry} />;
}
