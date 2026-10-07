import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { EmailRequestForm } from "@/components/auth/EmailRequestForm";

export const metadata: Metadata = { title: "Email verification" };

export default function VerifyEmailPage() {
  return (
    <AuthPanel title="Verify your email" description="Open the verification link in your email, then sign in.">
      <p className="mb-6 rounded-lg bg-info-soft p-3 text-workspace-body leading-relaxed text-info">
        Already opened a link? Try signing in. If the link expired or verification is still required, request a fresh one below.
      </p>
      <EmailRequestForm kind="verification" />
      <p className="mt-6 text-center text-workspace-sm">
        <Link href="/login" className="text-brand underline underline-offset-4">Back to sign in</Link>
      </p>
    </AuthPanel>
  );
}
