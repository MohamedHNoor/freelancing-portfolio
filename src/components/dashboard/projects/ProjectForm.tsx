"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { useForm, useWatch, type FieldErrors, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProject, updateProject } from "@/actions/projects";
import { AuthFeedback } from "@/components/auth/AuthFeedback";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { useAuthFeedback } from "@/components/auth/useAuthFeedback";
import { Field } from "@/components/dashboard/shared/Field";
import { NativeSelect } from "@/components/dashboard/shared/NativeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  newProjectFormSchema,
  presetErrorField,
  toProjectInput,
  type NewProjectFormValues,
} from "@/lib/dashboard/projects";
import { CURRENCIES, CURRENCY_NAMES, type Currency } from "@/lib/money";
import {
  PLAN_PRESET_MAX_MILESTONES,
  projectUpdateSchema,
  type ProjectUpdateInput,
  type ProjectUpdateValues,
  type ProjectValues,
} from "@/lib/validation/project";
import type { ActionFailure } from "@/types/action";

export type ProjectClientChoice = { id: string; displayName: string; defaultCurrency: Currency };

const PRESET_OPTIONS = [
  { value: "", label: "None: I'll add milestones myself" },
  { value: "deposit_30", label: "30% deposit + N milestones" },
  { value: "deposit_50", label: "50% deposit + N milestones" },
  { value: "fixed", label: "Fixed amounts: N equal milestones" },
] as const;

/** Visible fields in focus order, so the first error found is the first one focused. */
const NEW_FIELDS = [
  "clientId",
  "name",
  "description",
  "currency",
  "total",
  "startDate",
  "expectedEndDate",
  "presetKind",
  "presetCount",
] as const satisfies readonly (keyof NewProjectFormValues)[];

const EDIT_FIELDS = [
  "name",
  "description",
  "currency",
  "total",
  "startDate",
  "expectedEndDate",
] as const satisfies readonly (keyof ProjectUpdateInput)[];

/** The action reports preset problems under `preset`; the form shows them on the count. */
function withPresetErrors(failure: ActionFailure): ActionFailure {
  const fieldErrors = failure.error.fieldErrors;
  if (!fieldErrors?.preset) return failure;
  const { preset, ...rest } = fieldErrors;
  return { ...failure, error: { ...failure.error, fieldErrors: { ...rest, [presetErrorField(["preset"])]: preset } } };
}

/** Creating a project: client, details and an optional plan preset, on one page. */
export function NewProjectForm({
  clients,
  defaultClientId,
}: {
  clients: ProjectClientChoice[];
  defaultClientId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { feedback, feedbackRef, reportFailure, clearFeedback } = useAuthFeedback();
  const defaultClient = clients.find((client) => client.id === defaultClientId);
  const initial: NewProjectFormValues = {
    clientId: defaultClient?.id ?? "",
    name: "",
    description: "",
    currency: defaultClient?.defaultCurrency ?? ("" as Currency),
    total: "",
    startDate: "",
    expectedEndDate: "",
    presetKind: "",
    presetCount: "3",
  };
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<NewProjectFormValues, unknown, ProjectValues>({
    resolver: zodResolver(newProjectFormSchema),
    defaultValues: initial,
  });
  const presetKind = useWatch({ control, name: "presetKind" });

  // Validated here, but the action re-parses the raw field text itself.
  const onSubmit = handleSubmit(() => {
    if (pending) return;
    clearFeedback();
    startTransition(async () => {
      const result = await createProject(toProjectInput(getValues()));
      if (result.success) {
        router.push(`/dashboard/projects/${result.data.projectId}`);
        router.refresh();
      } else {
        reportFailure(withPresetErrors(result), NEW_FIELDS, setError, setFocus);
      }
    });
  }, clearFeedback);

  const clientField = register("clientId", {
    onChange: (event: { target: { value: string } }) => {
      const chosen = clients.find((client) => client.id === event.target.value);
      if (chosen) setValue("currency", chosen.defaultCurrency);
    },
  });

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending} className="space-y-8">
      <Section legend="Client">
        <Field id="project-client" label="Client" required error={errors.clientId?.message}
          hint="The project's currency starts as this client's default.">
          {(control) => (
            <NativeSelect {...control} {...clientField} defaultValue={initial.clientId} disabled={pending}>
              <option value="">Choose a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.displayName}</option>
              ))}
            </NativeSelect>
          )}
        </Field>
      </Section>

      <DetailsSection register={register} errors={errors} pending={pending} initial={initial} />

      <Section legend="Payment plan">
        <Field id="project-preset" label="Starting plan" error={errors.presetKind?.message}
          hint="A shortcut that creates editable milestones. You can change every row afterwards.">
          {(control) => (
            <NativeSelect {...control} {...register("presetKind")} defaultValue="" disabled={pending}>
              {PRESET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </NativeSelect>
          )}
        </Field>
        {presetKind !== "" && (
          <Field id="project-preset-count" label="Number of milestones (N)" required error={errors.presetCount?.message}
            hint={`From 1 to ${PLAN_PRESET_MAX_MILESTONES}, not counting the deposit.`}>
            {(control) => (
              <Input {...control} {...register("presetCount")} defaultValue={initial.presetCount} readOnly={pending}
                type="number" inputMode="numeric" min={1} max={PLAN_PRESET_MAX_MILESTONES} step={1} className="h-11 w-28 px-3" />
            )}
          </Field>
        )}
      </Section>

      <AuthFeedback state={feedback} feedbackRef={feedbackRef} />

      <FormButtons pending={pending} cancelHref="/dashboard/projects" submitLabel="Create project" />
    </form>
  );
}

/** Editing a project's details. Its client is fixed at creation. */
export function ProjectDetailsForm({ projectId, defaultValues }: { projectId: string; defaultValues: ProjectUpdateInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { feedback, feedbackRef, reportFailure, reportSuccess, clearFeedback } = useAuthFeedback();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    getValues,
    formState: { errors },
  } = useForm<ProjectUpdateInput, unknown, ProjectUpdateValues>({
    resolver: zodResolver(projectUpdateSchema),
    defaultValues,
  });

  // Validated here, but the action re-parses the raw field text itself.
  const onSubmit = handleSubmit(() => {
    if (pending) return;
    clearFeedback();
    startTransition(async () => {
      const result = await updateProject(projectId, getValues());
      if (result.success) {
        reportSuccess("Project details saved.");
        router.refresh();
      } else {
        reportFailure(result, EDIT_FIELDS, setError, setFocus);
      }
    });
  }, clearFeedback);

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending} className="space-y-8">
      <DetailsSection register={register} errors={errors} pending={pending} initial={defaultValues}
        totalHint="Percentage milestones are recalculated from a new total." />
      <AuthFeedback state={feedback} feedbackRef={feedbackRef} />
      <FormButtons pending={pending} cancelHref={`/dashboard/projects/${projectId}`} submitLabel="Save changes" />
    </form>
  );
}

type DetailField = (typeof EDIT_FIELDS)[number];
type DetailsValues = Pick<ProjectUpdateInput, DetailField>;

/* Both forms register the same detail fields; the register and errors types are
   narrowed to those fields so one section serves both. */
function DetailsSection({
  register,
  errors,
  pending,
  initial,
  totalHint,
}: {
  register: (field: DetailField) => UseFormRegisterReturn<DetailField>;
  errors: FieldErrors<DetailsValues>;
  pending: boolean;
  initial: DetailsValues;
  totalHint?: string;
}) {
  const text = (field: DetailField, extra: Record<string, unknown> = {}) => ({
    ...register(field),
    defaultValue: initial[field] ?? "",
    readOnly: pending,
    className: "h-11 px-3",
    ...extra,
  });

  return (
    <Section legend="Project details">
      <div className="sm:col-span-2">
        <Field id="project-name" label="Project name" required error={errors.name?.message}>
          {(control) => <Input {...control} {...text("name", { autoComplete: "off" })} />}
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field id="project-description" label="Description" hint="The scope, in a few lines." error={errors.description?.message}>
          {(control) => (
            <Textarea {...control} {...register("description")} defaultValue={initial.description ?? ""} readOnly={pending}
              rows={4} className="min-h-24 px-3 py-2" />
          )}
        </Field>
      </div>
      <Field id="project-currency" label="Currency" required error={errors.currency?.message}>
        {(control) => (
          <NativeSelect {...control} {...register("currency")} defaultValue={initial.currency} disabled={pending}>
            <option value="">Choose a currency</option>
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>{currency} · {CURRENCY_NAMES[currency]}</option>
            ))}
          </NativeSelect>
        )}
      </Field>
      <Field id="project-total" label="Project total" required error={errors.total?.message}
        hint={totalHint ?? "Such as 15,000.00, in the project's currency."}>
        {(control) => <Input {...control} {...text("total", { inputMode: "decimal", autoComplete: "off", className: "h-11 px-3 font-mono tabular-nums" })} />}
      </Field>
      <Field id="project-start" label="Start date" error={errors.startDate?.message}>
        {(control) => <Input {...control} {...text("startDate", { type: "date" })} />}
      </Field>
      <Field id="project-end" label="Expected end date" error={errors.expectedEndDate?.message}>
        {(control) => <Input {...control} {...text("expectedEndDate", { type: "date" })} />}
      </Field>
    </Section>
  );
}

function FormButtons({ pending, cancelHref, submitLabel }: { pending: boolean; cancelHref: string; submitLabel: string }) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button asChild variant="outline" className="min-h-11 px-4">
        <Link href={cancelHref}>Cancel</Link>
      </Button>
      <div className="sm:w-48">
        <AuthSubmitButton pending={pending} pendingLabel="Saving…">{submitLabel}</AuthSubmitButton>
      </div>
    </div>
  );
}

function Section({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="workspace-surface rounded-2xl border border-border bg-card px-5 py-6 sm:px-8">
      <legend className="float-left mb-5 w-full font-heading text-lg font-semibold">{legend}</legend>
      <div className="clear-both grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
