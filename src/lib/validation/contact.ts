import { z } from "zod";

/** A const tuple so the select options and the enum cannot drift apart. */
export const PROJECT_TYPES = [
  "figma-conversion",
  "saas-build",
  "other",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  "figma-conversion": "Figma design to a production site",
  "saas-build": "A platform or SaaS build",
  other: "Something else",
};

/* One schema, imported by the form and re-run by the action. The action never
   trusts a client-side parse: the browser can send anything.

   `name` has its carriage returns and newlines replaced because it is the only
   submitted value that reaches a mail header, the subject line. Resend takes
   JSON rather than raw SMTP so this is not the classic injection hole, but a
   value bound for a header is sanitised at the boundary regardless. */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please give your name, at least two characters.")
    .max(100, "That name is longer than 100 characters.")
    .transform((value) => value.replace(/[\r\n]+/g, " ")),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "That address is longer than 254 characters.")
    .email("That does not look like an email address."),

  projectType: z.enum(PROJECT_TYPES, {
    errorMap: () => ({ message: "Choose the kind of project this is." }),
  }),

  timeline: z
    .string()
    .trim()
    .min(1, "Roughly when would you want this done?")
    .max(100, "Please keep the timeline under 100 characters."),

  /** Aids scoping. Never rendered anywhere on the site. */
  budgetRange: z
    .string()
    .trim()
    .max(100, "Please keep the budget note under 100 characters.")
    .optional(),

  message: z
    .string()
    .trim()
    .min(20, "Please give at least 20 characters, so I can reply usefully.")
    .max(5000, "Please keep the message under 5000 characters."),

  /* Honeypot. A human never sees this field, so a human never fails it. The
     action checks it server-side and does not rely on the client having done
     so. */
  company: z.string().max(0, "This field must be left empty."),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactSubmission = z.output<typeof contactSchema>;
