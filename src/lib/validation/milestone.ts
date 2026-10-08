import { z } from "zod";
import { dateInputSchema, idSchema, percentInputSchema } from "@/lib/validation/money";
import { optionalText, requiredText } from "@/lib/validation/text";

const baseShape = {
  name: requiredText(120, "Enter the milestone name."),
  description: optionalText(2000),
  billingTrigger: z.enum(["upfront", "on_completion"], {
    errorMap: () => ({ message: "Choose when this milestone is billed." }),
  }),
  dueDate: dateInputSchema,
};

/**
 * A milestone of the payment plan. A percentage milestone's amount is computed
 * on the server; a fixed amount stays text here and is converted on the server
 * in the project's currency, which the form does not decide.
 */
export const milestoneInputSchema = z.discriminatedUnion(
  "pricingMode",
  [
    z.object({ ...baseShape, pricingMode: z.literal("percentage"), percent: percentInputSchema }),
    z.object({
      ...baseShape,
      pricingMode: z.literal("fixed"),
      amount: z.string({ required_error: "Enter an amount." }).trim().min(1, "Enter an amount."),
    }),
  ],
  { errorMap: () => ({ message: "Choose a percentage or a fixed amount." }) },
);

export type MilestoneInput = z.input<typeof milestoneInputSchema>;
export type MilestoneValues = z.output<typeof milestoneInputSchema>;

export const reorderMilestonesSchema = z.object({
  ids: z
    .array(idSchema)
    .min(1, "Nothing to reorder.")
    .refine((ids) => new Set(ids).size === ids.length, "Each milestone can appear only once."),
});

/** Every stored field an update can change, in form order. Activity records list changes in this order. */
export const MILESTONE_FIELDS = [
  "name",
  "description",
  "billingTrigger",
  "pricingMode",
  "percentageBps",
  "amountMinor",
  "dueDate",
] as const;

export type MilestoneField = (typeof MILESTONE_FIELDS)[number];
export const milestoneFieldSchema = z.enum(MILESTONE_FIELDS);
