"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMilestone, deleteMilestone, reorderMilestones, restoreMilestone } from "@/actions/milestones";
import { MilestoneForm } from "@/components/dashboard/projects/MilestoneForm";
import { MilestoneRow, type PlanEditorRow, type RowCommand } from "@/components/dashboard/projects/MilestoneRow";
import { PlanPresetPicker } from "@/components/dashboard/projects/PlanPresetPicker";
import { MoneyAmount } from "@/components/dashboard/shared/MoneyAmount";
import { EMPTY_MILESTONE_FORM } from "@/lib/dashboard/projects";
import type { ActionResult } from "@/types/action";

export type PlanSummaryLabels = { total: string; allocated: string; unallocated: string; balanced: boolean };

/** The id order after moving one row a place up or down. */
function moved(ids: string[], id: string, direction: "up" | "down"): string[] {
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/**
 * Edits a project's payment plan. Every figure comes from the server: after a
 * change succeeds the page refreshes, and the new summary and amounts render.
 */
export function PlanEditor({
  projectId,
  isDraft,
  currency,
  summary,
  rows,
  canAddDeposit,
  showPreset,
}: {
  projectId: string;
  isDraft: boolean;
  currency: string;
  summary: PlanSummaryLabels;
  rows: PlanEditorRow[];
  canAddDeposit: boolean;
  showPreset: boolean;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [failure, setFailure] = useState<string | null>(null);
  const focusAfterMove = useRef<{ id: string; direction: "up" | "down" } | null>(null);
  /** Where focus goes once the refreshed plan renders, when the clicked button is gone. */
  const focusAfterChange = useRef<string | null>(null);
  const ids = rows.map((row) => row.id);
  const depositFirst = rows[0]?.deposit === true;

  // After a reorder renders, keep focus on the moved row's button, or its
  // other move button when the first is now disabled at the end of the list.
  useEffect(() => {
    // Delete removes the row, and cancel and restore swap the row's buttons, so
    // the clicked button is gone: focus its replacement, or the list heading.
    if (focusAfterChange.current !== null) {
      (document.getElementById(focusAfterChange.current) ?? document.getElementById("milestones-heading"))?.focus();
      focusAfterChange.current = null;
    }
    const pending = focusAfterMove.current;
    if (pending === null) return;
    focusAfterMove.current = null;
    const same = document.getElementById(`move-${pending.direction}-${pending.id}`) as HTMLButtonElement | null;
    const other = document.getElementById(`move-${pending.direction === "up" ? "down" : "up"}-${pending.id}`);
    (same && !same.disabled ? same : other)?.focus();
  }, [rows]);

  function run(command: RowCommand, row: PlanEditorRow): Promise<string | null> {
    setFailure(null);
    return new Promise((resolve) => {
      startTransition(async () => {
        let result: ActionResult<unknown>;
        if (command === "up" || command === "down") {
          result = await reorderMilestones(projectId, { ids: moved(ids, row.id, command) });
          if (result.success) focusAfterMove.current = { id: row.id, direction: command };
        } else if (command === "delete") {
          result = await deleteMilestone(row.id);
          if (result.success) focusAfterChange.current = "milestones-heading";
        } else if (command === "cancel") {
          result = await cancelMilestone(row.id);
          if (result.success) focusAfterChange.current = `restore-${row.id}`;
        } else {
          result = await restoreMilestone(row.id);
          if (result.success) focusAfterChange.current = `edit-button-${row.id}`;
        }
        if (result.success) {
          router.refresh();
          resolve(null);
        } else {
          // Confirm dialogs show their own error; other commands use the page's announced region.
          if (command !== "delete" && command !== "cancel") setFailure(result.error.message);
          resolve(result.error.message);
        }
      });
    });
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="plan-summary-heading" className="workspace-surface rounded-2xl border border-border bg-card px-5 py-6 sm:px-8">
        <h2 id="plan-summary-heading" className="sr-only">Plan summary</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          {[
            ["Total", summary.total],
            ["Allocated", summary.allocated],
            ["Unallocated", summary.unallocated],
          ].map(([term, value]) => (
            <div key={term} className="space-y-1">
              <dt className="text-workspace-sm text-muted-foreground">{term}</dt>
              <dd className="font-medium"><MoneyAmount value={value} /></dd>
            </div>
          ))}
          <div className="space-y-1">
            <dt className="text-workspace-sm text-muted-foreground">Plan</dt>
            <dd role="status" aria-live="polite" className={summary.balanced ? "font-medium text-success" : "font-medium text-info"}>
              {summary.balanced ? "Balanced" : "Not balanced yet"}
            </dd>
          </div>
        </dl>
      </section>

      {failure && (
        <p role="alert" className="rounded-lg bg-danger-soft p-3 text-workspace-body text-danger">{failure}</p>
      )}

      {showPreset && (
        <section aria-labelledby="preset-heading" className="workspace-surface space-y-4 rounded-2xl border border-border bg-card px-5 py-6 sm:px-8">
          <div className="space-y-1">
            <h2 id="preset-heading" className="font-heading text-lg font-semibold">Start from a preset</h2>
            <p className="text-workspace-body text-muted-foreground">
              Creates editable milestones that add up to the total. Or add milestones one at a time below.
            </p>
          </div>
          <PlanPresetPicker projectId={projectId} />
        </section>
      )}

      <section aria-labelledby="milestones-heading" className="workspace-surface space-y-5 rounded-2xl border border-border bg-card px-5 py-6 sm:px-8">
        <h2 id="milestones-heading" tabIndex={-1} className="rounded font-heading text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Milestones
        </h2>
        {rows.length === 0 ? (
          <p className="text-workspace-body text-muted-foreground">No milestones yet.</p>
        ) : (
          <ol className="space-y-3">
            {rows.map((row, index) => (
              <MilestoneRow
                key={row.id}
                row={row}
                currency={currency}
                isDraft={isDraft}
                canMoveUp={index > 0 && !row.deposit && !(index === 1 && depositFirst)}
                canMoveDown={index < rows.length - 1 && !row.deposit}
                busy={busy}
                onCommand={run}
                onSaved={() => router.refresh()}
              />
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="add-milestone-heading" className="workspace-surface space-y-5 rounded-2xl border border-border bg-card px-5 py-6 sm:px-8">
        <h2 id="add-milestone-heading" className="font-heading text-lg font-semibold">Add a milestone</h2>
        <MilestoneForm
          idPrefix="new-milestone"
          target={{ kind: "create", projectId }}
          currency={currency}
          defaultValues={EMPTY_MILESTONE_FORM}
          allowDeposit={canAddDeposit}
          submitLabel="Add milestone"
          onDone={() => router.refresh()}
        />
      </section>
    </div>
  );
}
