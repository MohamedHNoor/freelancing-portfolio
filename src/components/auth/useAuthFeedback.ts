"use client";

import { useEffect, useRef, useState } from "react";
import type { FieldPath, FieldValues, UseFormSetError, UseFormSetFocus } from "react-hook-form";
import { knownFieldErrors } from "@/lib/auth/ui";
import type { ActionFailure } from "@/types/action";
import type { AuthFeedbackState } from "@/types/auth";

export function useAuthFeedback() {
  const [feedback, setFeedback] = useState<AuthFeedbackState>({ kind: "idle" });
  const feedbackRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (feedback.kind === "failure" && feedback.focusSummary) {
      feedbackRef.current?.focus();
    }
  }, [feedback]);

  function reportFailure<Values extends FieldValues>(
    failure: ActionFailure,
    fields: readonly FieldPath<Values>[],
    setError: UseFormSetError<Values>,
    setFocus: UseFormSetFocus<Values>,
  ) {
    const errors = knownFieldErrors(failure.error.fieldErrors, fields);
    for (const { field, message } of errors) {
      setError(field, { type: "server", message });
    }
    const first = errors[0];
    if (first) setFocus(first.field);
    setFeedback({ kind: "failure", message: failure.error.message, focusSummary: !first });
  }

  return {
    feedback,
    feedbackRef,
    reportFailure,
    clearFeedback: () => setFeedback({ kind: "idle" }),
    reportSuccess: (message: string) => setFeedback({ kind: "success", message }),
  };
}
