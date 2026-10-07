import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getProfile } from "@/content";
import { AppSidebar } from "@/components/dashboard/shell/AppSidebar";
import { Topbar } from "@/components/dashboard/shell/Topbar";
import { SkipLink } from "@/components/layout/SkipLink";
import { requireOwner } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Overview · Dashboard", template: "%s · Dashboard" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireOwner();
  const { name } = getProfile();

  return (
    <div className="workspace-ui min-h-dvh bg-background">
      <SkipLink />
      <div className="lg:flex">
        <aside
          aria-label="Business workspace"
          className="sticky top-0 hidden h-dvh w-workspace-sidebar shrink-0 flex-col border-r border-border bg-card lg:flex"
        >
          <AppSidebar name={name} />
        </aside>
        <div className="min-w-0 flex-1">
          <Topbar name={name} />
          <main
            id="main-content"
            tabIndex={-1}
            aria-label="Dashboard content"
            className="mx-auto max-w-workspace px-5 py-8 outline-none sm:px-8 lg:py-10"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
