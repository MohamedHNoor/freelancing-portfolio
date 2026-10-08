"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient, updateClient } from "@/actions/clients";
import { AuthFeedback } from "@/components/auth/AuthFeedback";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { useAuthFeedback } from "@/components/auth/useAuthFeedback";
import { Field } from "@/components/dashboard/shared/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES, CURRENCY_NAMES } from "@/lib/money";
import { clientInputSchema, type ClientInput, type ClientValues } from "@/lib/validation/client";

/** Visible fields in focus order, so the first error found is the first one focused. */
const FORM_FIELDS = [
  "name",
  "email",
  "phone",
  "companyName",
  "defaultCurrency",
  "countryCode",
  "addressLine1",
  "addressLine2",
  "city",
  "region",
  "postalCode",
  "notes",
] as const satisfies readonly (keyof ClientInput)[];

const EMPTY: ClientInput = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  countryCode: "",
  defaultCurrency: "" as ClientInput["defaultCurrency"],
  addressLine1: "",
  addressLine2: "",
  city: "",
  region: "",
  postalCode: "",
  notes: "",
};

type ClientFormProps =
  | { mode: "create" }
  | { mode: "edit"; clientId: string; defaultValues: ClientInput };

export function ClientForm(props: ClientFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { feedback, feedbackRef, reportFailure, clearFeedback } = useAuthFeedback();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<ClientInput, unknown, ClientValues>({
    resolver: zodResolver(clientInputSchema),
    defaultValues: props.mode === "edit" ? props.defaultValues : EMPTY,
  });
  // Also rendered as HTML defaults, so the server output is already filled in.
  const initial = props.mode === "edit" ? props.defaultValues : EMPTY;

  const onSubmit = handleSubmit((values) => {
    if (pending) return;
    clearFeedback();
    startTransition(async () => {
      const result =
        props.mode === "edit" ? await updateClient(props.clientId, values) : await createClient(values);
      if (result.success) {
        router.push(`/dashboard/clients/${result.data.clientId}`);
        router.refresh();
      } else {
        reportFailure(result, FORM_FIELDS, setError, setFocus);
      }
    });
  }, clearFeedback);

  const text = (field: (typeof FORM_FIELDS)[number], autoComplete: string, extra: { type?: string } = {}) => ({
    ...register(field),
    defaultValue: initial[field] ?? "",
    autoComplete,
    readOnly: pending,
    className: "h-11 px-3",
    ...extra,
  });

  const cancelHref = props.mode === "edit" ? `/dashboard/clients/${props.clientId}` : "/dashboard/clients";

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={pending} className="space-y-8">
      <Section legend="Contact">
        <Field id="client-name" label="Contact name" required error={errors.name?.message}>
          {(control) => <Input {...control} {...text("name", "name")} />}
        </Field>
        <Field id="client-email" label="Email address" required error={errors.email?.message}>
          {(control) => <Input {...control} {...text("email", "email", { type: "email" })} />}
        </Field>
        <Field id="client-phone" label="Phone" error={errors.phone?.message}>
          {(control) => <Input {...control} {...text("phone", "tel", { type: "tel" })} />}
        </Field>
        <Field id="client-company" label="Company" error={errors.companyName?.message}>
          {(control) => <Input {...control} {...text("companyName", "organization")} />}
        </Field>
      </Section>

      <Section legend="Billing">
        <Field id="client-currency" label="Default currency" required error={errors.defaultCurrency?.message}
          hint="New projects for this client start in this currency.">
          {(control) => <CurrencySelect {...control} disabled={pending} defaultValue={initial.defaultCurrency} registration={register("defaultCurrency")} />}
        </Field>
        <Field id="client-country" label="Country code" hint="Two letters, such as NZ." error={errors.countryCode?.message}>
          {(control) => <Input {...control} {...text("countryCode", "country")} maxLength={2} className="h-11 w-24 px-3 uppercase" />}
        </Field>
        <Field id="client-address1" label="Address line 1" error={errors.addressLine1?.message}>
          {(control) => <Input {...control} {...text("addressLine1", "address-line1")} />}
        </Field>
        <Field id="client-address2" label="Address line 2" error={errors.addressLine2?.message}>
          {(control) => <Input {...control} {...text("addressLine2", "address-line2")} />}
        </Field>
        <Field id="client-city" label="City" error={errors.city?.message}>
          {(control) => <Input {...control} {...text("city", "address-level2")} />}
        </Field>
        <Field id="client-region" label="Region or state" error={errors.region?.message}>
          {(control) => <Input {...control} {...text("region", "address-level1")} />}
        </Field>
        <Field id="client-postal" label="Postal code" error={errors.postalCode?.message}>
          {(control) => <Input {...control} {...text("postalCode", "postal-code")} className="h-11 w-40 px-3" />}
        </Field>
      </Section>

      <Section legend="Notes">
        <Field id="client-notes" label="Private notes" hint="Only you can see these." error={errors.notes?.message}>
          {(control) => <Textarea {...control} {...register("notes")} defaultValue={initial.notes ?? ""} readOnly={pending} rows={5} className="min-h-28 px-3 py-2" />}
        </Field>
      </Section>

      <AuthFeedback state={feedback} feedbackRef={feedbackRef} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="outline" className="min-h-11 px-4">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <div className="sm:w-48">
          <AuthSubmitButton pending={pending} pendingLabel="Saving…">
            {props.mode === "edit" ? "Save changes" : "Create client"}
          </AuthSubmitButton>
        </div>
      </div>
    </form>
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

function CurrencySelect({
  registration,
  disabled,
  defaultValue,
  ...control
}: {
  registration: UseFormRegisterReturn<"defaultCurrency">;
  disabled: boolean;
  defaultValue: string;
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": boolean;
  "aria-required": boolean | undefined;
}) {
  return (
    <select
      data-slot="select"
      {...control}
      {...registration}
      defaultValue={defaultValue}
      disabled={disabled}
      className="h-11 w-full rounded-lg border border-input px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
    >
      <option value="">Choose a currency</option>
      {CURRENCIES.map((currency) => (
        <option key={currency} value={currency}>
          {currency} · {CURRENCY_NAMES[currency]}
        </option>
      ))}
    </select>
  );
}
