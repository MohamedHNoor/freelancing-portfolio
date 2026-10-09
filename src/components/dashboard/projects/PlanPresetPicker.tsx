"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import { applyPlanPreset } from "@/actions/milestones";
import { AuthFeedback } from "@/components/auth/AuthFeedback";
import { useAuthFeedback } from "@/components/auth/useAuthFeedback";
import { Field } from "@/components/dashboard/shared/Field";
import { NativeSelect } from "@/components/dashboard/shared/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLAN_PRESET_MAX_MILESTONES, planPresetSchema, type PlanPreset, type PlanPresetInput } from "@/lib/validation/project";
import type { ActionFailure } from "@/types/action";

const FIELDS = ["kind", "count"] as const;

/** The action reports a too-small total under `preset`; it belongs on the count. */
function onCount(failure: ActionFailure): ActionFailure {
  const { preset, ...rest } = failure.error.fieldErrors ?? {};
  return preset ? { ...failure, error: { ...failure.error, fieldErrors: { ...rest, count: preset } } } : failure;
}

/** Starts an empty draft plan from a preset. Only offered while the draft has no milestones. */
export function PlanPresetPicker({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState("deposit_30");
  const { feedback, feedbackRef, reportFailure, clearFeedback } = useAuthFeedback();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    getValues,
    formState: { errors },
  } = useForm<PlanPresetInput, unknown, PlanPreset>({
    resolver: zodResolver(planPresetSchema),
    defaultValues: { kind: "deposit_30", count: 3 },
  });

  const onSubmit = handleSubmit(() => {
    if (pending) return;
    clearFeedback();
    startTransition(async () => {
      const result = await applyPlanPreset(projectId, getValues());
      if (result.success) router.refresh();
      else reportFailure(onCount(result), FIELDS, setError, setFocus);
    });
  }, clearFeedback);

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <Field id="preset-kind" label="Preset" error={errors.kind?.message}>
          {(c) => (
            <NativeSelect {...c} {...register("kind", { onChange: (event: { target: { value: string } }) => setKind(event.target.value) })}
              defaultValue="deposit_30" disabled={pending}>
              <option value="deposit_30">30% deposit + N milestones</option>
              <option value="deposit_50">50% deposit + N milestones</option>
              <option value="fixed">Fixed amounts: N equal milestones</option>
            </NativeSelect>
          )}
        </Field>
        <Field id="preset-count" label="Milestones (N)" required error={errors.count?.message}
          hint={kind === "fixed" ? `1 to ${PLAN_PRESET_MAX_MILESTONES}.` : `1 to ${PLAN_PRESET_MAX_MILESTONES}, plus the deposit.`}>
          {(c) => <Input {...c} {...register("count")} defaultValue={3} readOnly={pending} type="number" inputMode="numeric"
            min={1} max={PLAN_PRESET_MAX_MILESTONES} step={1} className="h-11 w-28 px-3" />}
        </Field>
      </div>
      <AuthFeedback state={feedback} feedbackRef={feedbackRef} />
      <Button type="submit" disabled={pending} className="min-h-11 px-4">
        {pending && <LoaderCircleIcon className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
        {pending ? "Applying…" : "Apply preset"}
      </Button>
    </form>
  );
}
