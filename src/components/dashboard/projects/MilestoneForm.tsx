"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMilestone, updateMilestone } from "@/actions/milestones";
import { AuthFeedback } from "@/components/auth/AuthFeedback";
import { useAuthFeedback } from "@/components/auth/useAuthFeedback";
import { Field } from "@/components/dashboard/shared/Field";
import { NativeSelect } from "@/components/dashboard/shared/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircleIcon } from "lucide-react";
import { milestoneFormSchema, toMilestoneInput, type MilestoneFormValues } from "@/lib/dashboard/projects";
import type { MilestoneValues } from "@/lib/validation/milestone";

const FIELDS = ["name", "pricingMode", "percent", "amount", "billingTrigger", "dueDate", "description"] as const satisfies readonly (keyof MilestoneFormValues)[];

/**
 * Adds a milestone, or edits one in place. The server computes every amount:
 * a percentage's money value and the plan totals arrive with the refresh.
 */
export function MilestoneForm({
  idPrefix,
  target,
  currency,
  defaultValues,
  allowDeposit,
  submitLabel,
  onDone,
  onCancel,
}: {
  idPrefix: string;
  target: { kind: "create"; projectId: string } | { kind: "edit"; milestoneId: string };
  currency: string;
  defaultValues: MilestoneFormValues;
  /** Whether "Upfront deposit" may be chosen here, as the service allows. */
  allowDeposit: boolean;
  submitLabel: string;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const { feedback, feedbackRef, reportFailure, clearFeedback } = useAuthFeedback();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    getValues,
    reset,
    control,
    formState: { errors },
  } = useForm<MilestoneFormValues, unknown, MilestoneValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues,
  });
  const pricingMode = useWatch({ control, name: "pricingMode" });
  const id = (field: string) => `${idPrefix}-${field}`;

  // Validated here, but the action re-parses the raw field text itself.
  const onSubmit = handleSubmit(() => {
    if (pending) return;
    clearFeedback();
    startTransition(async () => {
      const input = toMilestoneInput(getValues());
      const result =
        target.kind === "create" ? await createMilestone(target.projectId, input) : await updateMilestone(target.milestoneId, input);
      if (result.success) {
        if (target.kind === "create") reset(defaultValues);
        onDone();
      } else {
        reportFailure(result, FIELDS, setError, setFocus);
      }
    });
  }, clearFeedback);

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id={id("name")} label="Milestone name" required error={errors.name?.message}>
            {(c) => <Input {...c} {...register("name")} defaultValue={defaultValues.name} readOnly={pending} autoComplete="off" className="h-11 px-3" />}
          </Field>
        </div>
        <Field id={id("mode")} label="Priced as" error={errors.pricingMode?.message}>
          {(c) => (
            <NativeSelect {...c} {...register("pricingMode")} defaultValue={defaultValues.pricingMode} disabled={pending}>
              <option value="percentage">A percentage of the total</option>
              <option value="fixed">A fixed amount</option>
            </NativeSelect>
          )}
        </Field>
        {pricingMode === "percentage" ? (
          <Field id={id("percent")} label="Percentage" required error={errors.percent?.message} hint="Such as 30 or 12.5.">
            {(c) => <Input {...c} {...register("percent")} defaultValue={defaultValues.percent} readOnly={pending} inputMode="decimal" autoComplete="off" className="h-11 px-3 font-mono tabular-nums" />}
          </Field>
        ) : (
          <Field id={id("amount")} label={`Amount (${currency})`} required error={errors.amount?.message} hint="Such as 1,500.00.">
            {(c) => <Input {...c} {...register("amount")} defaultValue={defaultValues.amount} readOnly={pending} inputMode="decimal" autoComplete="off" className="h-11 px-3 font-mono tabular-nums" />}
          </Field>
        )}
        {allowDeposit ? (
          <Field id={id("trigger")} label="Billed" error={errors.billingTrigger?.message}>
            {(c) => (
              <NativeSelect {...c} {...register("billingTrigger")} defaultValue={defaultValues.billingTrigger} disabled={pending}>
                <option value="on_completion">When the work is complete</option>
                <option value="upfront">Upfront, as the deposit</option>
              </NativeSelect>
            )}
          </Field>
        ) : (
          <input type="hidden" {...register("billingTrigger")} defaultValue={defaultValues.billingTrigger} />
        )}
        <Field id={id("due")} label="Due date" error={errors.dueDate?.message}>
          {(c) => <Input {...c} {...register("dueDate")} defaultValue={defaultValues.dueDate} readOnly={pending} type="date" className="h-11 px-3" />}
        </Field>
        <div className="sm:col-span-2">
          <Field id={id("description")} label="Description" error={errors.description?.message}>
            {(c) => <Textarea {...c} {...register("description")} defaultValue={defaultValues.description} readOnly={pending} rows={2} className="min-h-16 px-3 py-2" />}
          </Field>
        </div>
      </div>
      <AuthFeedback state={feedback} feedbackRef={feedbackRef} />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending} className="min-h-11 px-4">
          {pending && <LoaderCircleIcon className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
          {pending ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending} className="min-h-11 px-4">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
