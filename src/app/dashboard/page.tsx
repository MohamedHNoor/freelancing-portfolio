import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRightIcon, FolderKanbanIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireOwner } from "@/server/auth/session";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  // Layouts can be reused during navigation; each protected page also guards itself.
  await requireOwner();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Your private workspace
        </p>
        <h1 className="font-heading text-workspace-title font-semibold tracking-tight">
          Overview
        </h1>
        <p className="max-w-xl text-workspace-body leading-relaxed text-muted-foreground">
          A home for your clients, projects and milestone payments.
        </p>
      </div>

      <section
        aria-labelledby="workspace-start-heading"
        className="workspace-surface rounded-2xl border border-border bg-card px-6 py-12 sm:px-10 sm:py-16"
      >
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-brand ring-1 ring-inset ring-primary/15"
          >
            <FolderKanbanIcon className="size-6" />
          </span>
          <h2 id="workspace-start-heading" className="font-heading text-xl font-semibold">
            Your work, in one place
          </h2>
          <p className="mt-3 text-workspace-body leading-relaxed text-muted-foreground">
            Client, project and payment tools are coming soon. This will be your
            place to follow work from the first brief to the final payment.
          </p>
          <Button asChild variant="outline" className="mt-7 min-h-11 px-4">
            <Link href="/" prefetch={false}>
              View public portfolio
              <ArrowUpRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      <p className="text-workspace-sm leading-relaxed text-muted-foreground">
        Your public portfolio remains available to visitors.
      </p>
    </div>
  );
}
