import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { loginNotice } from "@/lib/auth/ui";
import { getOwner } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string | string[] }>;
}) {
  if (await getOwner()) redirect("/dashboard");
  const notice = loginNotice(await searchParams);
  return (
    <AuthPanel title="Welcome back" description="Sign in to your private business workspace.">
      {notice && (
        <p role="status" className="workspace-reveal mb-5 rounded-lg bg-success-soft p-3 text-workspace-body leading-relaxed text-success">
          {notice}
        </p>
      )}
      <LoginForm />
    </AuthPanel>
  );
}
