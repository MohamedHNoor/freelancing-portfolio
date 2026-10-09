import { MoneyAmount } from "@/components/dashboard/shared/MoneyAmount";
import { StatusBadge, type StatusTone } from "@/components/dashboard/shared/StatusBadge";
import type { MilestoneStatus } from "@/generated/prisma/enums";
import { MILESTONE_WORK_LABELS, formatCalendarDate, formatPercent } from "@/lib/dashboard/projects";
import { formatMoney, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { MilestoneView } from "@/server/queries/projects";

const WORK_TONES: Record<MilestoneStatus, StatusTone> = {
  pending: "neutral",
  in_progress: "info",
  completed: "success",
  cancelled: "danger",
};

/** A server component: the plan in position order, with amounts formatted in the project's currency. */
export function PaymentPlanTable({ milestones, currency }: { milestones: MilestoneView[]; currency: Currency }) {
  return (
    <div
      role="region"
      aria-label="Payment plan milestones"
      tabIndex={0}
      className="overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <table className="w-full min-w-[44rem] text-left text-workspace-body">
        <caption className="sr-only">Payment plan, in order</caption>
        <thead className="border-b border-border text-workspace-sm text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Milestone</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Share</th>
            <th scope="col" className="px-4 py-3 font-medium">Work</th>
            <th scope="col" className="px-4 py-3 font-medium">Payment</th>
            <th scope="col" className="px-4 py-3 font-medium">Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {milestones.map((milestone) => {
            const cancelled = milestone.status === "cancelled";
            const deposit = milestone.billingTrigger === "upfront";
            return (
              <tr key={milestone.id} className={cn(cancelled && "text-muted-foreground")}>
                <th scope="row" className="px-4 py-3 align-top font-medium">
                  <span className={cn("break-words", cancelled && "line-through")}>{milestone.name}</span>
                  {cancelled && <span className="sr-only"> (cancelled, not counted)</span>}
                </th>
                <td className="px-4 py-3 text-right align-top">
                  <MoneyAmount value={formatMoney(milestone.amountMinor, currency)} />
                </td>
                <td className="px-4 py-3 text-right align-top font-mono tabular-nums">
                  {milestone.pricingMode === "percentage" && milestone.percentageBps !== null
                    ? formatPercent(milestone.percentageBps)
                    : <span className="font-sans">Fixed</span>}
                </td>
                <td className="px-4 py-3 align-top">
                  {deposit && !cancelled ? (
                    <StatusBadge label="Deposit" />
                  ) : (
                    <StatusBadge label={MILESTONE_WORK_LABELS[milestone.status]} tone={WORK_TONES[milestone.status]} />
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  {cancelled ? <span>Not billed</span> : <StatusBadge label="Unbilled" />}
                </td>
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  {milestone.dueDate ? (
                    <time dateTime={milestone.dueDate}>{formatCalendarDate(milestone.dueDate)}</time>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
