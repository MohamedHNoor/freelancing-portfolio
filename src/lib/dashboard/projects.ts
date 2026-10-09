import { z } from "zod";
import type { MilestoneStatus, ProjectStatus } from "@/generated/prisma/enums";
import { calendarDateToDb, formatDate } from "@/lib/dates";
import { minorToInput, type Currency } from "@/lib/money";
import { PROJECT_TRANSITIONS } from "@/lib/state/project";
import { milestoneInputSchema, type MilestoneInput } from "@/lib/validation/milestone";
import {
  PROJECT_STATUSES,
  projectInputSchema,
  type PlanPresetKind,
  type ProjectInput,
  type ProjectStatusAction,
  type ProjectUpdateInput,
} from "@/lib/validation/project";

export type ProjectStatusFilter = ProjectStatus | "all";

/** The list's `?status=` value. Only one exact, known status narrows the list. */
export function parseProjectStatusFilter(value: unknown): ProjectStatusFilter {
  return typeof value === "string" && (PROJECT_STATUSES as readonly string[]).includes(value)
    ? (value as ProjectStatus)
    : "all";
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const MILESTONE_WORK_LABELS: Record<MilestoneStatus, string> = {
  pending: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Basis points as the text a percentage field takes: 3000 is "30", 1250 is "12.5", 1 is "0.01". */
export function bpsToPercentInput(bps: number): string {
  const whole = Math.floor(bps / 100);
  const fraction = String(bps % 100).padStart(2, "0").replace(/0+$/, "");
  return fraction === "" ? String(whole) : `${whole}.${fraction}`;
}

/** Basis points for display: 1250 is "12.5%". */
export function formatPercent(bps: number): string {
  return `${bpsToPercentInput(bps)}%`;
}

/** A `YYYY-MM-DD` calendar date for display: "1 Mar 2026". */
export function formatCalendarDate(value: string): string {
  const date = calendarDateToDb(value);
  if (date === null) throw new RangeError("Expected a calendar date.");
  return formatDate(date);
}

type StoredProjectDetails = {
  name: string;
  description: string | null;
  currency: Currency;
  totalAmountMinor: number;
  startDate: string | null;
  expectedEndDate: string | null;
};

/** A project as edit-form values; empty fields become "". */
export function projectFormValues(project: StoredProjectDetails): ProjectUpdateInput {
  return {
    name: project.name,
    description: project.description ?? "",
    currency: project.currency,
    total: minorToInput(project.totalAmountMinor, project.currency),
    startDate: project.startDate ?? "",
    expectedEndDate: project.expectedEndDate ?? "",
  };
}

type StoredMilestoneDetails = {
  name: string;
  description: string | null;
  billingTrigger: "upfront" | "on_completion";
  pricingMode: "percentage" | "fixed";
  percentageBps: number | null;
  amountMinor: number;
  dueDate: string | null;
};

/** A milestone as edit-form values in its project's currency; empty fields become "". */
export function milestoneFormValues(milestone: StoredMilestoneDetails, currency: Currency): MilestoneInput {
  const base = {
    name: milestone.name,
    description: milestone.description ?? "",
    billingTrigger: milestone.billingTrigger,
    dueDate: milestone.dueDate ?? "",
  };
  return milestone.pricingMode === "percentage"
    ? { ...base, pricingMode: "percentage", percent: bpsToPercentInput(milestone.percentageBps ?? 0) }
    : { ...base, pricingMode: "fixed", amount: minorToInput(milestone.amountMinor, currency) };
}

export const PROJECT_ACTION_LABELS: Record<ProjectStatusAction, string> = {
  activate: "Activate project",
  pause: "Put on hold",
  resume: "Resume project",
  complete: "Mark project complete",
  reopen: "Reopen project",
  cancel: "Cancel project",
};

export type ProjectStatusActionOption = {
  action: ProjectStatusAction;
  label: string;
  /** Why the action is unavailable, or null when it can run. */
  disabledReason: string | null;
};

/**
 * The status changes that exist from `status`, in state-machine order. Activate
 * and complete stay listed when their plan guard fails, with the reason, so the
 * owner sees what to do next.
 */
export function projectStatusActions(
  status: ProjectStatus,
  { canActivate, canComplete }: { canActivate: boolean; canComplete: boolean },
): ProjectStatusActionOption[] {
  return (Object.keys(PROJECT_TRANSITIONS) as ProjectStatusAction[])
    .filter((action) => PROJECT_TRANSITIONS[action].from.includes(status))
    .map((action) => ({
      action,
      label: PROJECT_ACTION_LABELS[action],
      disabledReason:
        action === "activate" && !canActivate
          ? "Balance the payment plan first."
          : action === "complete" && !canComplete
            ? "Complete every milestone first."
            : null,
    }));
}

/**
 * The new-project form's values. The plan preset is two flat fields, so each
 * gets its own label and error; `toProjectInput` turns them into the action's
 * `preset`, which is null when no preset is chosen.
 */
export type NewProjectFormValues = Omit<ProjectInput, "preset"> & {
  presetKind: PlanPresetKind | "";
  presetCount: string;
};

/** What `projectInputSchema` parses: the preset count is still the field's text, which the schema coerces. */
export type NewProjectInput = Omit<ProjectInput, "preset"> & { preset: { kind: PlanPresetKind; count: string } | null };

export function toProjectInput({ presetKind, presetCount, ...rest }: NewProjectFormValues): NewProjectInput {
  return { ...rest, preset: presetKind === "" ? null : { kind: presetKind, count: presetCount } };
}

/** Where an error on the action's `preset` belongs in the form: the kind, or else the count. */
export function presetErrorField(path: readonly PropertyKey[]): "presetKind" | "presetCount" {
  return path[1] === "kind" ? "presetKind" : "presetCount";
}

/** The new-project form schema: `projectInputSchema`, with preset errors moved onto the flat fields. */
export const newProjectFormSchema = z
  .custom<NewProjectFormValues>((value) => typeof value === "object" && value !== null)
  .transform((value, ctx) => {
    const parsed = projectInputSchema.safeParse(toProjectInput(value));
    if (parsed.success) return parsed.data;
    for (const issue of parsed.error.issues) {
      const path = issue.path[0] === "preset" ? [presetErrorField(issue.path)] : issue.path;
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: issue.message });
    }
    return z.NEVER;
  });

/**
 * A milestone form's values. Both the percentage and the amount stay in the
 * form so switching the pricing mode keeps what was typed; `toMilestoneInput`
 * sends only the one the mode uses.
 */
export type MilestoneFormValues = {
  name: string;
  description: string;
  billingTrigger: "upfront" | "on_completion";
  pricingMode: "percentage" | "fixed";
  percent: string;
  amount: string;
  dueDate: string;
};

export const EMPTY_MILESTONE_FORM: MilestoneFormValues = {
  name: "",
  description: "",
  billingTrigger: "on_completion",
  pricingMode: "percentage",
  percent: "",
  amount: "",
  dueDate: "",
};

export function toMilestoneInput({ percent, amount, ...rest }: MilestoneFormValues): MilestoneInput {
  return rest.pricingMode === "percentage"
    ? { ...rest, pricingMode: "percentage", percent }
    : { ...rest, pricingMode: "fixed", amount };
}

/** A stored milestone as form values, with the unused pricing field empty. */
export function milestoneFormFields(milestone: StoredMilestoneDetails, currency: Currency): MilestoneFormValues {
  const input = milestoneFormValues(milestone, currency);
  return {
    ...EMPTY_MILESTONE_FORM,
    name: input.name,
    description: input.description ?? "",
    billingTrigger: input.billingTrigger,
    pricingMode: input.pricingMode,
    dueDate: input.dueDate ?? "",
    ...(input.pricingMode === "percentage" ? { percent: input.percent } : { amount: input.amount }),
  };
}

/** The milestone form schema: `milestoneInputSchema` over the field the pricing mode uses. */
export const milestoneFormSchema = z
  .custom<MilestoneFormValues>((value) => typeof value === "object" && value !== null)
  .transform((value, ctx) => {
    const parsed = milestoneInputSchema.safeParse(toMilestoneInput(value));
    if (parsed.success) return parsed.data;
    for (const issue of parsed.error.issues) ctx.addIssue({ code: z.ZodIssueCode.custom, path: issue.path, message: issue.message });
    return z.NEVER;
  });
