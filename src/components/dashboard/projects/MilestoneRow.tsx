"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, RotateCcwIcon, Trash2Icon, XCircleIcon } from "lucide-react";
import { MilestoneForm } from "@/components/dashboard/projects/MilestoneForm";
import { ConfirmDialog } from "@/components/dashboard/shared/ConfirmDialog";
import { MoneyAmount } from "@/components/dashboard/shared/MoneyAmount";
import { Button } from "@/components/ui/button";
import type { MilestoneFormValues } from "@/lib/dashboard/projects";
import { cn } from "@/lib/utils";

/** One plan row, with every label and amount already formatted on the server. */
export type PlanEditorRow = {
  id: string;
  name: string;
  description: string | null;
  cancelled: boolean;
  deposit: boolean;
  amountLabel: string;
  shareLabel: string;
  workLabel: string;
  due: { label: string; iso: string } | null;
  formValues: MilestoneFormValues;
  /** Whether this row may become, or stay, the deposit. */
  canBeDeposit: boolean;
};

export type RowCommand = "up" | "down" | "delete" | "cancel" | "restore";

const iconButton = "min-h-11 min-w-11 px-3";

export function MilestoneRow({
  row,
  currency,
  isDraft,
  canMoveUp,
  canMoveDown,
  busy,
  onCommand,
  onSaved,
}: {
  row: PlanEditorRow;
  currency: string;
  isDraft: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  busy: boolean;
  /** Runs a command; resolves to an error message for a confirm dialog, or null. */
  onCommand: (command: RowCommand, row: PlanEditorRow) => Promise<string | null>;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);

  // Opening the form focuses its first field; closing it returns focus to Edit,
  // since the form's own buttons are gone.
  useEffect(() => {
    if (editing) document.getElementById(`milestone-${row.id}-name`)?.focus();
    else if (wasEditing.current) editButton.current?.focus();
    wasEditing.current = editing;
  }, [editing, row.id]);

  return (
    <li className={cn("rounded-xl border border-border px-4 py-4 sm:px-5", row.cancelled && "bg-muted/40")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h3 className="break-words font-medium">
            <span className={cn(row.cancelled && "text-muted-foreground line-through")}>{row.name}</span>
            {row.deposit && row.name.trim().toLowerCase() !== "deposit" && <span className="ml-2 text-workspace-sm font-normal text-muted-foreground">Deposit</span>}
            {row.cancelled && <span className="ml-2 text-workspace-sm font-normal text-danger">Cancelled, not counted</span>}
          </h3>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-workspace-sm text-muted-foreground">
            <MoneyAmount value={row.amountLabel} className="text-foreground" />
            <span>{row.shareLabel}</span>
            {!row.deposit && <span>{row.workLabel}</span>}
            {row.due && <span>Due <time dateTime={row.due.iso}>{row.due.label}</time></span>}
          </p>
          {row.description && <p className="whitespace-pre-line break-words text-workspace-sm">{row.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button id={`move-up-${row.id}`} type="button" variant="outline" className={iconButton} disabled={busy || !canMoveUp}
            onClick={() => onCommand("up", row)} aria-label={`Move ${row.name} up`}>
            <ArrowUpIcon className="size-4" aria-hidden="true" />
          </Button>
          <Button id={`move-down-${row.id}`} type="button" variant="outline" className={iconButton} disabled={busy || !canMoveDown}
            onClick={() => onCommand("down", row)} aria-label={`Move ${row.name} down`}>
            <ArrowDownIcon className="size-4" aria-hidden="true" />
          </Button>
          {row.cancelled ? (
            <Button id={`restore-${row.id}`} type="button" variant="outline" className="min-h-11 px-3" disabled={busy} onClick={() => onCommand("restore", row)}
              aria-label={`Restore ${row.name}`}>
              <RotateCcwIcon className="size-4" aria-hidden="true" />
              Restore
            </Button>
          ) : (
            <>
              <Button ref={editButton} id={`edit-button-${row.id}`} type="button" variant="outline" className="min-h-11 px-3" disabled={busy || editing} onClick={() => setEditing(true)}
                aria-label={`Edit ${row.name}`} aria-expanded={editing} aria-controls={`edit-${row.id}`}>
                <PencilIcon className="size-4" aria-hidden="true" />
                Edit
              </Button>
              {isDraft ? (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="outline" className="min-h-11 px-3" disabled={busy} aria-label={`Delete ${row.name}`}>
                      <Trash2Icon className="size-4" aria-hidden="true" />
                      Delete
                    </Button>
                  }
                  title={`Delete ${row.name}?`}
                  description="It is removed from the plan, and its share becomes unallocated."
                  confirmLabel="Delete milestone"
                  pendingLabel="Deleting…"
                  destructive
                  onConfirm={() => onCommand("delete", row)}
                />
              ) : (
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="outline" className="min-h-11 px-3" disabled={busy} aria-label={`Cancel ${row.name}`}>
                      <XCircleIcon className="size-4" aria-hidden="true" />
                      Cancel
                    </Button>
                  }
                  title={`Cancel ${row.name}?`}
                  description="It stays in the plan as cancelled, and its amount becomes unallocated. You can restore it later if the plan still fits."
                  confirmLabel="Cancel milestone"
                  pendingLabel="Cancelling…"
                  destructive
                  onConfirm={() => onCommand("cancel", row)}
                />
              )}
            </>
          )}
        </div>
      </div>
      {editing && (
        <div id={`edit-${row.id}`} className="mt-5 border-t border-border pt-5">
          <MilestoneForm
            idPrefix={`milestone-${row.id}`}
            target={{ kind: "edit", milestoneId: row.id }}
            currency={currency}
            defaultValues={row.formValues}
            allowDeposit={row.canBeDeposit}
            submitLabel="Save milestone"
            onDone={() => {
              setEditing(false);
              onSaved();
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}
    </li>
  );
}
