import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import type { PlanEditorRow } from "@/components/dashboard/projects/MilestoneRow";
import { PlanEditor } from "@/components/dashboard/projects/PlanEditor";
import { MILESTONE_WORK_LABELS, formatCalendarDate, formatPercent, milestoneFormFields } from "@/lib/dashboard/projects";
import { formatMoney } from "@/lib/money";
import { EDITABLE_PROJECT_STATUSES } from "@/lib/state/project";
import { requireOwner } from "@/server/auth/session";
import { loadProjectOrNotFound } from "@/server/queries/load-project";

export const metadata: Metadata = { title: "Payment plan" };

export default async function PlanPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { userId } = await requireOwner();
  const { projectId } = await params;
  const project = await loadProjectOrNotFound(userId, projectId);
  // A completed or cancelled project's plan is fixed.
  if (!EDITABLE_PROJECT_STATUSES.includes(project.status)) redirect(`/dashboard/projects/${project.id}`);

  const money = (minor: number) => formatMoney(minor, project.currency);
  // The service's deposit rules: at most one upfront milestone, counting
  // cancelled ones, and only ever in first place.
  const hasDeposit = project.milestones.some((m) => m.billingTrigger === "upfront");
  const rows: PlanEditorRow[] = project.milestones.map((m, index) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    cancelled: m.status === "cancelled",
    deposit: m.billingTrigger === "upfront",
    amountLabel: money(m.amountMinor),
    shareLabel: m.pricingMode === "percentage" && m.percentageBps !== null ? formatPercent(m.percentageBps) : "Fixed",
    workLabel: MILESTONE_WORK_LABELS[m.status],
    due: m.dueDate ? { label: formatCalendarDate(m.dueDate), iso: m.dueDate } : null,
    formValues: milestoneFormFields(m, project.currency),
    canBeDeposit: m.billingTrigger === "upfront" || (index === 0 && !hasDeposit),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="inline-flex min-h-11 items-center gap-2 rounded text-workspace-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        <span className="break-words">{project.name}</span>
      </Link>
      <div className="space-y-2">
        <h1 className="font-heading text-workspace-title font-semibold tracking-tight">Payment plan</h1>
        <p className="max-w-2xl text-workspace-body leading-relaxed text-muted-foreground">
          Milestones in billing order. Percentages are worked out from the project total, and the plan must add up
          to the total exactly before the project can be activated.
        </p>
      </div>
      <PlanEditor
        projectId={project.id}
        isDraft={project.status === "draft"}
        currency={project.currency}
        summary={{
          total: money(project.totalAmountMinor),
          allocated: money(project.plan.allocated),
          unallocated: money(project.plan.unallocated),
          balanced: project.plan.balanced,
        }}
        rows={rows}
        canAddDeposit={!hasDeposit}
        showPreset={project.status === "draft" && project.milestones.length === 0}
      />
    </div>
  );
}
