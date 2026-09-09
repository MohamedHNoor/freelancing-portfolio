"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitContact } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  contactSchema,
  type ContactInput,
} from "@/lib/validation/contact";
import { cn } from "@/lib/utils";

type Status =
  | { kind: "idle" }
  | { kind: "sent" }
  | { kind: "failed"; message: string };

const FIELD_CLASS =
  "mt-2 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20";

/* `handleSubmit` rather than a form `action` with `useActionState`. React Hook
   Form owns client validation and, on an invalid submit, moves focus to the
   first field that failed. A form action would post before any of that ran and
   the focus behaviour would have to be rebuilt by hand.
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
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      projectType: "figma-conversion",
      timeline: "",
      budgetRange: "",
      message: "",
      company: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setStatus({ kind: "idle" });
    startTransition(async () => {
      const result = await submitContact(values);

      if (result.success) {
        reset();
        setStatus({ kind: "sent" });
        return;
      }

      /* The server re-validates, so it can reject something the client let
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
          <Label htmlFor="name">Your name</Label>
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
          <Label htmlFor="projectType">What kind of project?</Label>
          {/* A native select, not the Radix one. Three options, a real mobile
              picker, no controller layer, and nothing to get wrong. */}
          <select
            id="projectType"
            aria-invalid={errors.projectType !== undefined}
            aria-describedby={describedBy("projectType")}
            className={cn(
              "mt-2 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              "aria-[invalid=true]:border-destructive",
            )}
            {...register("projectType")}
          >
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

        <div className="min-w-0">
          <Label htmlFor="timeline">Rough timeline</Label>
          <Input
            id="timeline"
            placeholder="Next month, no fixed date, ..."
            aria-invalid={errors.timeline !== undefined}
            aria-describedby={describedBy("timeline")}
            className={FIELD_CLASS}
            {...register("timeline")}
          />
          <FieldError id="timeline-error" message={errors.timeline?.message} />
        </div>

        <div className="min-w-0 sm:col-span-2">
          <Label htmlFor="budgetRange">
            Budget range{" "}
            <span className="font-normal text-muted-foreground">
              (optional, and never shown publicly)
            </span>
          </Label>
          <Input
            id="budgetRange"
            aria-invalid={errors.budgetRange !== undefined}
            aria-describedby={describedBy("budgetRange")}
            className={FIELD_CLASS}
            {...register("budgetRange")}
          />
          <FieldError
            id="budgetRange-error"
            message={errors.budgetRange?.message}
          />
        </div>

        <div className="min-w-0 sm:col-span-2">
          <Label htmlFor="message">What are you building?</Label>
          <Textarea
            id="message"
            rows={6}
            aria-invalid={errors.message !== undefined}
            aria-describedby={describedBy("message")}
            className={FIELD_CLASS}
            {...register("message")}
          />
          <FieldError id="message-error" message={errors.message?.message} />
        </div>
      </div>

      {/* The honeypot. Screen-reader-only rather than `display: none`, and not
          inside `aria-hidden`, because hiding a focusable control from the
          accessibility tree is its own violation. Anyone who does reach it is
          told plainly to leave it alone. */}
      <div className="sr-only">
        <Label htmlFor="company">Leave this field empty</Label>
        <input
          id="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("company")}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          disabled={pending}
          className="h-11 gap-2 px-5 text-[0.95rem]"
        >
          {pending ? "Sending..." : "Send enquiry"}
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
            ? "Thanks. That reached my inbox, and I reply to everything."
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
