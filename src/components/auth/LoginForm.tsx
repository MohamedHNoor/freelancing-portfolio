"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/actions/auth";
import { AuthFeedback } from "@/components/auth/AuthFeedback";
import { AuthField } from "@/components/auth/AuthField";
import { useAuthFeedback } from "@/components/auth/useAuthFeedback";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { feedback, feedbackRef, reportFailure, clearFeedback } = useAuthFeedback();
  const { register, handleSubmit, setError, setFocus, formState: { errors } } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    if (pending) return;
    clearFeedback();
    startTransition(async () => {
      const result = await signIn(values);
      if (result.success) {
        router.replace(result.data.redirectTo);
        router.refresh();
      } else {
        reportFailure(result, ["email", "password"], setError, setFocus);
      }
    });
  }, clearFeedback);

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending} className="space-y-5">
      <AuthField id="login-email" label="Email address" type="email" autoComplete="username" required
        readOnly={pending} error={errors.email?.message} {...register("email")} />
      <AuthField id="login-password" label="Password" type="password" autoComplete="current-password" required
        readOnly={pending} error={errors.password?.message} {...register("password")} />
      <AuthFeedback state={feedback} feedbackRef={feedbackRef} />
      <AuthSubmitButton pending={pending} pendingLabel="Signing in…">Sign in</AuthSubmitButton>
      <div className="flex flex-wrap justify-between gap-3 text-workspace-sm">
        <Link href="/forgot-password" className="text-brand underline underline-offset-4">Forgot password?</Link>
        <Link href="/verify-email" className="text-brand underline underline-offset-4">Verify your email</Link>
      </div>
    </form>
  );
}
