"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset, resendVerification } from "@/actions/auth";
import { AuthFeedback } from "@/components/auth/AuthFeedback";
import { AuthField } from "@/components/auth/AuthField";
import { useAuthFeedback } from "@/components/auth/useAuthFeedback";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { emailOnlySchema, type EmailOnlyInput } from "@/lib/validation/auth";

export function EmailRequestForm({ kind }: { kind: "password" | "verification" }) {
  const [pending, startTransition] = useTransition();
  const { feedback, feedbackRef, reportFailure, clearFeedback, reportSuccess } = useAuthFeedback();
  const { register, handleSubmit, setError, setFocus, formState: { errors } } = useForm<EmailOnlyInput>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit((values) => {
    if (pending) return;
    clearFeedback();
    startTransition(async () => {
      const action = kind === "password" ? requestPasswordReset : resendVerification;
      const result = await action(values);
      if (result.success) {
        reportSuccess("If this address is eligible, check your inbox and spam folder for a link. You can request another if it does not arrive.");
      } else {
        reportFailure(result, ["email"], setError, setFocus);
      }
    });
  }, clearFeedback);

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending} className="space-y-5">
      <AuthField id={`${kind}-email`} label="Email address" type="email" autoComplete="email" required
        readOnly={pending} error={errors.email?.message} {...register("email")} />
      <AuthFeedback state={feedback} feedbackRef={feedbackRef} />
      <AuthSubmitButton pending={pending} pendingLabel="Requesting link…">
        {kind === "password" ? "Request password link" : "Request verification link"}
      </AuthSubmitButton>
    </form>
  );
}
