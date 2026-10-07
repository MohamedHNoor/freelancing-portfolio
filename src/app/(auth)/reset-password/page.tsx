import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Button } from "@/components/ui/button";
import { resetTokenFromQuery } from "@/lib/auth/ui";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>;
}) {
  const query = await searchParams;
  // The installed provider's callback adds token on success, or this fixed
  // error on failure. No arbitrary callback text is rendered.
  const token = resetTokenFromQuery(query);

  return (
    <AuthPanel title="Choose a new password" description="Set a password for your private business workspace.">
      {token === null ? (
        <div className="space-y-5">
          <p className="rounded-lg bg-danger-soft p-3 text-workspace-body leading-relaxed text-danger">
            This link is incomplete, invalid or has expired. Request a new password link to continue.
          </p>
          <Button asChild className="h-11 w-full"><Link href="/forgot-password">Request a new link</Link></Button>
          <p className="text-center text-workspace-sm"><Link href="/login" className="text-brand underline underline-offset-4">Back to sign in</Link></p>
        </div>
      ) : <ResetPasswordForm token={token} />}
    </AuthPanel>
  );
}
