"use client";

import { ErrorPanel } from "@/components/layout/ErrorPanel";

export default function ProjectsError({ retry }: {
  error: unknown;
  reset: () => void;
  retry: () => void;
}) {
  return <ErrorPanel onRetry={retry} />;
}
