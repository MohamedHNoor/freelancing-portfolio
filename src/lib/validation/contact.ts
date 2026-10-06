import { z } from "zod";

/* Const tuples so the select options, the enums and the labels cannot drift
   apart. A label is what the form shows and what the enquiry email prints. */

export const PROJECT_TYPES = [
  "business-website",
  "web-application",
  "saas-product",
  "ecommerce",
  "booking-system",
  "admin-dashboard",
  "figma-to-nextjs",
  "other",
] as const;

/* `Service.enquiryType` is typed from this, so a service can never link to a
   project type the form cannot select. */
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  "business-website": "Business Website",
  "web-application": "Custom Web Application",
  "saas-product": "SaaS Product",
  ecommerce: "E-commerce Website",
  "booking-system": "Booking System",
  "admin-dashboard": "Admin Dashboard",
  "figma-to-nextjs": "Figma to Next.js Development",
  other: "Other",
};

export const EXISTING_DESIGN_OPTIONS = [
  "figma",
  "existing-site",
  "needs-planning",
  "not-sure",
] as const;

export type ExistingDesign = (typeof EXISTING_DESIGN_OPTIONS)[number];

export const EXISTING_DESIGN_LABELS: Record<ExistingDesign, string> = {
  figma: "Yes, I have Figma designs",
  "existing-site": "Yes, I have an existing website or application",
  "needs-planning": "No, I need help planning it",
  "not-sure": "Not sure yet",
};

/* NZD, because the business is in Wellington. Brackets in the form are the
   only place figures appear on the site, and they are never rendered anywhere
   else: they help scope a reply, they are not a price list. */
export const BUDGET_RANGES = [
  "under-5k",
  "5k-15k",
  "15k-30k",
  "30k-60k",
  "60k-plus",
  "not-sure",
] as const;

export type BudgetRange = (typeof BUDGET_RANGES)[number];

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  "under-5k": "Under NZ$5,000",
  "5k-15k": "NZ$5,000 to NZ$15,000",
  "15k-30k": "NZ$15,000 to NZ$30,000",
  "30k-60k": "NZ$30,000 to NZ$60,000",
  "60k-plus": "NZ$60,000 or more",
  "not-sure": "Not sure yet",
};

export const TIMELINES = [
  "asap",
  "within-1-month",
  "1-3-months",
  "3-6-months",
  "flexible",
] as const;

export type Timeline = (typeof TIMELINES)[number];

export const TIMELINE_LABELS: Record<Timeline, string> = {
  asap: "As soon as possible",
  "within-1-month": "Within 1 month",
  "1-3-months": "1 to 3 months",
  "3-6-months": "3 to 6 months",
  flexible: "Flexible",
};

/** The project type a `?type=` query asks the form to preselect, when it
 *  names a real one. Service and case study calls to action link to the form
 *  this way; anything else in the query is ignored rather than trusted. */
export function projectTypeFromQuery(search: string): ProjectType | undefined {
  const value = new URLSearchParams(search).get("type");
  return PROJECT_TYPES.find((type) => type === value);
}

/* One schema, imported by the form and re-run by the action. The action never
   trusts a client-side parse: the browser can send anything.

   `name` has its carriage returns and newlines replaced because it is the only
   submitted value that reaches a mail header, the subject line. Resend takes
   JSON rather than raw SMTP so this is not the classic injection hole, but a
   value bound for a header is sanitised at the boundary regardless.

   Required selects start on an empty "Choose one" option rather than a
   preselected answer, so a submitted value is one the visitor actually chose. */
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

  company: z
    .string()
    .trim()
    .max(120, "Please keep the company name under 120 characters.")
    .optional(),

  projectType: z.enum(PROJECT_TYPES, {
    errorMap: () => ({ message: "Choose what you are looking to build." }),
  }),

  message: z
    .string()
    .trim()
    .min(20, "Please give at least 20 characters, so I can reply usefully.")
    .max(5000, "Please keep the description under 5000 characters."),

  existingDesign: z.enum(EXISTING_DESIGN_OPTIONS, {
    errorMap: () => ({ message: "Choose the option closest to where you are." }),
  }),

  /** Aids scoping. Never rendered anywhere on the site. */
  budgetRange: z.union([z.enum(BUDGET_RANGES), z.literal("")]).optional(),

  timeline: z.enum(TIMELINES, {
    errorMap: () => ({ message: "Roughly when would you want this done?" }),
  }),

  /* Honeypot. A human never sees this field, so a human never fails it. The
     action checks it server-side and does not rely on the client having done
     so. */
  website: z.string().max(0, "This field must be left empty."),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactSubmission = z.output<typeof contactSchema>;
