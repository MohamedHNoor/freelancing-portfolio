import type { Ref } from "react";
import { cn } from "@/lib/utils";
import type { AuthFeedbackState } from "@/types/auth";

export function AuthFeedback({
  state,
  feedbackRef,
}: {
  state: AuthFeedbackState;
  feedbackRef: Ref<HTMLParagraphElement>;
}) {
  return (
    <p
      ref={feedbackRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={-1}
      className={cn(
        "rounded-lg text-workspace-body leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring",
        state.kind === "idle" ? "sr-only" : "workspace-reveal p-3",
        state.kind === "failure" && "bg-danger-soft text-danger",
        state.kind === "success" && "bg-info-soft text-info",
      )}
    >
      {state.kind === "idle" ? "" : state.message}
    </p>
  );
}
