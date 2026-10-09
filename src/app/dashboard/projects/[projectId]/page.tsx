import type { Metadata } from "next";
import Link from "next/link";
import { ListOrderedIcon } from "lucide-react";
import { PaymentPlanTable } from "@/components/dashboard/projects/PaymentPlanTable";
import { ProgressPair } from "@/components/dashboard/projects/ProgressPair";
import { ProjectHeader } from "@/components/dashboard/projects/ProjectHeader";
import { MoneyAmount } from "@/components/dashboard/shared/MoneyAmount";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { EDITABLE_PROJECT_STATUSES } from "@/lib/state/project";
import { requireOwner } from "@/server/auth/session";
import { loadProjectOrNotFound } from "@/server/queries/load-project";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { userId } = await requireOwner();
  const { projectId } = await params;
  const project = await loadProjectOrNotFound(userId, projectId);

  const money = (minor: number) => formatMoney(minor, project.currency);
  const editable = EDITABLE_PROJECT_STATUSES.includes(project.status);
  const counted = project.milestones.filter((m) => m.status !== "cancelled").length;
  const figures = [
    { term: "Total", value: money(project.totalAmountMinor) },
    { term: "Paid", value: money(project.figures.paid) },
    { term: "Outstanding", value: money(project.figures.outstanding) },
    { term: "Requested", value: money(project.figures.requested) },
    { term: "Unallocated", value: money(project.plan.unallocated) },
  ];

  return (
    <div className="space-y-8">
      <ProjectHeader project={project} />

      {project.status === "draft" && !project.canActivate && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-info-soft p-4 text-info">
          <p className="text-workspace-body leading-relaxed">
            {counted === 0 ? (
              "This draft can be activated once it has a payment plan that adds up to the total."
            ) : (
              <>
                <MoneyAmount value={money(project.plan.unallocated)} /> still to allocate before this draft can be
                activated.
              </>
            )}
          </p>
          <Link
            href={`/dashboard/projects/${project.id}/plan`}
            className="inline-flex min-h-11 items-center rounded font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Edit plan
          </Link>
        </div>
      )}

      <ProgressPair development={project.developmentProgress} payment={project.figures.paymentProgress} />

      <section aria-labelledby="project-figures-heading" className="workspace-surface rounded-2xl border border-border bg-card px-5 py-6 sm:px-8">
        <h2 id="project-figures-heading" className="sr-only">Figures</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {figures.map(({ term, value }) => (
            <div key={term} className="min-w-0 space-y-1">
              <dt className="text-workspace-sm text-muted-foreground">{term}</dt>
              <dd className="text-workspace-body font-medium"><MoneyAmount value={value} /></dd>
            </div>
          ))}
        </dl>
      </section>

      {project.description && (
        <section aria-labelledby="project-scope-heading" className="workspace-surface rounded-2xl border border-border bg-card px-5 py-6 sm:px-8">
          <h2 id="project-scope-heading" className="mb-3 font-heading text-lg font-semibold">Scope</h2>
          <p className="whitespace-pre-line break-words text-workspace-body leading-relaxed">{project.description}</p>
        </section>
      )}

      <section aria-labelledby="payment-plan-heading" className="workspace-surface space-y-5 rounded-2xl border border-border bg-card px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="payment-plan-heading" className="font-heading text-lg font-semibold">Payment plan</h2>
          {editable && (
            <Button asChild variant="outline" className="min-h-11 px-4">
              <Link href={`/dashboard/projects/${project.id}/plan`}>
                <ListOrderedIcon className="size-4" aria-hidden="true" />
                Edit plan
              </Link>
            </Button>
          )}
        </div>
        {project.milestones.length > 0 ? (
          <PaymentPlanTable milestones={project.milestones} currency={project.currency} />
        ) : (
          <p className="text-workspace-body text-muted-foreground">
            No milestones yet. Add them in the plan editor, starting from a preset or from scratch.
          </p>
        )}
      </section>
    </div>
  );
}
