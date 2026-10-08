import { z } from "zod";
import { parseMoney } from "@/lib/money";
import { currencySchema, dateInputSchema } from "@/lib/validation/money";
import { optionalText, requiredText } from "@/lib/validation/text";

export const PROJECT_STATUSES = ["draft", "active", "on_hold", "completed", "cancelled"] as const;
export const projectStatusSchema = z.enum(PROJECT_STATUSES);

export const PROJECT_STATUS_ACTIONS = ["activate", "pause", "resume", "complete", "reopen", "cancel"] as const;
export type ProjectStatusAction = (typeof PROJECT_STATUS_ACTIONS)[number];

export const projectStatusActionSchema = z.object({
  action: z.enum(PROJECT_STATUS_ACTIONS, { errorMap: () => ({ message: "Choose a status change." }) }),
});

export const PLAN_PRESET_KINDS = ["deposit_30", "deposit_50", "fixed"] as const;
export type PlanPresetKind = (typeof PLAN_PRESET_KINDS)[number];
export const PLAN_PRESET_MAX_MILESTONES = 10;

/** A plan shortcut: it produces editable draft milestones, never a rule. */
export const planPresetSchema = z.object({
  kind: z.enum(PLAN_PRESET_KINDS, { errorMap: () => ({ message: "Choose a payment plan." }) }),
  count: z.coerce
    .number({ invalid_type_error: "Enter how many milestones." })
    .int("Enter a whole number of milestones.")
    .min(1, "Use at least 1 milestone.")
    .max(PLAN_PRESET_MAX_MILESTONES, `Use at most ${PLAN_PRESET_MAX_MILESTONES} milestones.`),
});

export type PlanPresetInput = z.input<typeof planPresetSchema>;
export type PlanPreset = z.output<typeof planPresetSchema>;

const detailsShape = {
  name: requiredText(120, "Enter the project name."),
  description: optionalText(5000),
  currency: currencySchema,
  total: z.string({ required_error: "Enter the project total." }),
  startDate: dateInputSchema,
  expectedEndDate: dateInputSchema,
};

type Details = z.output<z.ZodObject<typeof detailsShape>>;

/** Converts the total in the chosen currency and checks the date order, reporting each on its own field. */
function withProjectRules<T extends Details>(value: T, ctx: z.RefinementCtx) {
  const totalAmountMinor = parseMoney(value.total, value.currency);
  if (totalAmountMinor === null || totalAmountMinor <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["total"],
      message: totalAmountMinor === null ? "Enter an amount such as 15,000.00." : "Enter a total greater than zero.",
    });
  }
  if (value.startDate !== null && value.expectedEndDate !== null && value.expectedEndDate < value.startDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["expectedEndDate"], message: "Choose an end date on or after the start date." });
  }
  if (totalAmountMinor === null || totalAmountMinor <= 0) return z.NEVER;
  return {
    name: value.name,
    description: value.description,
    currency: value.currency,
    totalAmountMinor,
    startDate: value.startDate,
    expectedEndDate: value.expectedEndDate,
  };
}

/** Editing a project. Its client is fixed at creation. */
export const projectUpdateSchema = z.object(detailsShape).transform(withProjectRules);

/** Creating a project, optionally with a plan preset. */
export const projectInputSchema = z
  .object({
    ...detailsShape,
    clientId: z.string({ required_error: "Choose a client." }).uuid("Choose a client."),
    preset: planPresetSchema.optional().nullable(),
  })
  .transform((value, ctx) => {
    const details = withProjectRules(value, ctx);
    if (details === z.NEVER) return z.NEVER;
    return { clientId: value.clientId, ...details, preset: value.preset ?? null };
  });

export type ProjectInput = z.input<typeof projectInputSchema>;
export type ProjectValues = z.output<typeof projectInputSchema>;
export type ProjectUpdateInput = z.input<typeof projectUpdateSchema>;
export type ProjectUpdateValues = z.output<typeof projectUpdateSchema>;

/** Every stored field an update can change, in form order. Activity records list changes in this order. */
export const PROJECT_FIELDS = [
  "name",
  "description",
  "currency",
  "totalAmountMinor",
  "startDate",
  "expectedEndDate",
] as const;

export type ProjectField = (typeof PROJECT_FIELDS)[number];
export const projectFieldSchema = z.enum(PROJECT_FIELDS);
