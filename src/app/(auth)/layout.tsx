import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { SkipLink } from "@/components/layout/SkipLink";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export const metadata: Metadata = {
  title: { default: "Account · Mohamed Noor", template: "%s · Mohamed Noor" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="workspace-ui min-h-dvh bg-background">
      <SkipLink />
      <header className="mx-auto flex max-w-workspace items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" prefetch={false} aria-label="Mohamed Noor home" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo loading="eager" />
        </Link>
        <ThemeToggle />
      </header>
      <main id="main-content" tabIndex={-1} aria-labelledby="auth-heading"
        className="flex min-h-[calc(100dvh-5.5rem)] items-center justify-center px-5 pb-12 pt-5 outline-none sm:px-8">
        {children}
      </main>
    </div>
  );
}
