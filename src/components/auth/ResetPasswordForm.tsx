"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/actions/auth";
import { AuthFeedback } from "@/components/auth/AuthFeedback";
import { AuthField } from "@/components/auth/AuthField";
import { useAuthFeedback } from "@/components/auth/useAuthFeedback";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [invalidLink, setInvalidLink] = useState(false);
  const { feedback, feedbackRef, reportFailure, clearFeedback } = useAuthFeedback();
  const { register, handleSubmit, reset, setError, setFocus, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    if (pending || invalidLink) return;
    clearFeedback();
    startTransition(async () => {
      const result = await resetPassword(values);
      if (result.success) {
        reset({ token: "", password: "" });
        router.replace("/login?reset=done");
        router.refresh();
      } else {
        if (result.error.code === "INVALID_TOKEN" || result.error.fieldErrors?.token?.length) {
          setInvalidLink(true);
        }
        reportFailure(result, ["password"], setError, setFocus);
      }
    });
  }, clearFeedback);

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending} className="space-y-5">
      {!invalidLink && (
        <>
          <AuthField id="reset-password" label="New password" type="password" autoComplete="new-password" required
            readOnly={pending} hint="Use 12–128 characters. Spaces are preserved."
            error={errors.password?.message} {...register("password")} />
          <AuthSubmitButton pending={pending} pendingLabel="Saving password…">
            Save new password
          </AuthSubmitButton>
        </>
      )}
      <AuthFeedback state={feedback} feedbackRef={feedbackRef} />
      <p className="text-center text-workspace-sm">
        <Link href="/forgot-password" className="text-brand underline underline-offset-4">Request a new password link</Link>
      </p>
    </form>
  );
}
