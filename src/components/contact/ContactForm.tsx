"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitContact } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BUDGET_RANGES,
  BUDGET_RANGE_LABELS,
  EXISTING_DESIGN_LABELS,
  EXISTING_DESIGN_OPTIONS,
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  TIMELINES,
  TIMELINE_LABELS,
  contactSchema,
  projectTypeFromQuery,
  type ContactInput,
} from "@/lib/validation/contact";
import { cn } from "@/lib/utils";

type Status =
  | { kind: "idle" }
  | { kind: "sent" }
  | { kind: "failed"; message: string };

const FIELD_CLASS =
  "mt-2 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20";

/* Native selects, not the Radix one: a real mobile picker, no controller
   layer, and nothing to get wrong. Styled to match `Input`. */
const SELECT_CLASS = cn(
  "mt-2 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
  "aria-[invalid=true]:border-destructive",
);

/* A client component because react-hook-form needs one, and React Hook Form owns
   client validation and, on an invalid submit, moves focus to the first field
   that failed. A form action would post before any of that ran and the focus
   behaviour would have to be rebuilt by hand.

   `useTransition` supplies the pending state, which is the documented way to
   track a Server Action called as a function. */
export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: "",
      budgetRange: "",
      website: "",
    },
  });

  /* A service or case study button links here as `/contact?type=...`. Read
     after mount rather than through `useSearchParams`, which would need a
     Suspense boundary and leave the form out of the static HTML. */
  useEffect(() => {
    const type = projectTypeFromQuery(window.location.search);
    if (type !== undefined) {
      setValue("projectType", type);
    }
  }, [setValue]);

  const onSubmit = handleSubmit((values) => {
    setStatus({ kind: "idle" });
    startTransition(async () => {
      const result = await submitContact(values);

      if (result.success) {
        reset();
        setStatus({ kind: "sent" });
        return;
      }

      /* The server re-validates, so a client parse that passed can still come
         through. Attach anything field-shaped to its input rather than only
         showing the summary. */
      for (const [field, messages] of Object.entries(
        result.error.fieldErrors ?? {},
      )) {
        const first = messages?.[0];
        if (first !== undefined) {
          setError(field as keyof ContactInput, { message: first });
        }
      }
      setStatus({ kind: "failed", message: result.error.message });
    });
  });

  const describedBy = (field: keyof ContactInput) =>
    errors[field] ? `${field}-error` : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-2xl">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="min-w-0">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            autoComplete="name"
            aria-invalid={errors.name !== undefined}
            aria-describedby={describedBy("name")}
            className={FIELD_CLASS}
            {...register("name")}
          />
          <FieldError id="name-error" message={errors.name?.message} />
        </div>

        <div className="min-w-0">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email !== undefined}
            aria-describedby={describedBy("email")}
            className={FIELD_CLASS}
            {...register("email")}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>

        <div className="min-w-0">
          <Label htmlFor="company">
            Company or business{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="company"
            autoComplete="organization"
            aria-invalid={errors.company !== undefined}
            aria-describedby={describedBy("company")}
            className={FIELD_CLASS}
            {...register("company")}
          />
          <FieldError id="company-error" message={errors.company?.message} />
        </div>

        <div className="min-w-0">
          <Label htmlFor="projectType">What are you looking to build?</Label>
          <select
            id="projectType"
            aria-invalid={errors.projectType !== undefined}
            aria-describedby={describedBy("projectType")}
            className={SELECT_CLASS}
            {...register("projectType")}
          >
            <option value="">Choose one</option>
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {PROJECT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <FieldError
            id="projectType-error"
            message={errors.projectType?.message}
          />
        </div>

        <div className="min-w-0 sm:col-span-2">
          <Label htmlFor="message">Project description</Label>
          <Textarea
            id="message"
            rows={6}
            placeholder="Tell me what you're trying to build, what problem it needs to solve, and any important requirements you already know."
            aria-invalid={errors.message !== undefined}
            aria-describedby={describedBy("message")}
            className={FIELD_CLASS}
            {...register("message")}
          />
          <FieldError id="message-error" message={errors.message?.message} />
        </div>

        <div className="min-w-0 sm:col-span-2">
          <Label htmlFor="existingDesign">Do you have an existing design?</Label>
          <select
            id="existingDesign"
            aria-invalid={errors.existingDesign !== undefined}
            aria-describedby={describedBy("existingDesign")}
            className={SELECT_CLASS}
            {...register("existingDesign")}
          >
            <option value="">Choose one</option>
            {EXISTING_DESIGN_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {EXISTING_DESIGN_LABELS[option]}
              </option>
            ))}
          </select>
          <FieldError
            id="existingDesign-error"
            message={errors.existingDesign?.message}
          />
        </div>

        <div className="min-w-0">
          <Label htmlFor="budgetRange">
            Budget range{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <select
            id="budgetRange"
            aria-invalid={errors.budgetRange !== undefined}
            aria-describedby={describedBy("budgetRange")}
            className={SELECT_CLASS}
            {...register("budgetRange")}
          >
            <option value="">Prefer not to say</option>
            {BUDGET_RANGES.map((range) => (
              <option key={range} value={range}>
                {BUDGET_RANGE_LABELS[range]}
              </option>
            ))}
          </select>
          <FieldError
            id="budgetRange-error"
            message={errors.budgetRange?.message}
          />
        </div>

        <div className="min-w-0">
          <Label htmlFor="timeline">Timeline</Label>
          <select
            id="timeline"
            aria-invalid={errors.timeline !== undefined}
            aria-describedby={describedBy("timeline")}
            className={SELECT_CLASS}
            {...register("timeline")}
          >
            <option value="">Choose one</option>
            {TIMELINES.map((timeline) => (
              <option key={timeline} value={timeline}>
                {TIMELINE_LABELS[timeline]}
              </option>
            ))}
          </select>
          <FieldError id="timeline-error" message={errors.timeline?.message} />
        </div>
      </div>

      {/* The honeypot. Screen-reader-only rather than `display: none`, and not
          inside `aria-hidden`, because hiding a focusable control from the
          accessibility tree is its own violation. Anyone who does reach it is
          told plainly to leave it alone. */}
      <div className="sr-only">
        <Label htmlFor="website">Leave this field empty</Label>
        {/* The `data-*` hints ask 1Password, LastPass and Bitwarden not to
            fill it, so a person's saved identity cannot trip the trap and
            have their enquiry silently dropped. */}
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          data-1p-ignore=""
          data-lpignore="true"
          data-bwignore=""
          {...register("website")}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          disabled={pending}
          className="h-11 gap-2 px-5 text-[0.95rem]"
        >
          {pending ? "Sending..." : "Send Project Enquiry"}
        </Button>

        {/* Always in the document so it has somewhere to announce into. */}
        <p
          role="status"
          aria-atomic="true"
          className={cn(
            "text-sm",
            status.kind === "failed" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {status.kind === "sent"
            ? "Thanks, your project enquiry has been received. I'll review the details and get back to you."
            : status.kind === "failed"
              ? status.message
              : ""}
        </p>
      </div>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (message === undefined) {
    return null;
  }
  return (
    <p id={id} className="mt-2 text-sm text-destructive">
      {message}
    </p>
  );
}
