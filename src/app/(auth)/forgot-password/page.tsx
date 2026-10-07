import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { EmailRequestForm } from "@/components/auth/EmailRequestForm";

export const metadata: Metadata = { title: "Password recovery" };

export default function ForgotPasswordPage() {
  return (
    <AuthPanel title="Set your password" description="Request a link to reset your password or set your first password for the owner account.">
      <EmailRequestForm kind="password" />
      <p className="mt-6 text-center text-workspace-sm">
        <Link href="/login" className="text-brand underline underline-offset-4">Back to sign in</Link>
      </p>
    </AuthPanel>
  );
}
