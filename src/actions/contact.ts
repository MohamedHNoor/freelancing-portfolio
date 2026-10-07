"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { Resend } from "resend";
import { formatFromHeader } from "@/lib/links";
import { checkRateLimit, clientKey, type RateLimitStore } from "@/lib/rate-limit";
import {
  BUDGET_RANGE_LABELS,
  EXISTING_DESIGN_LABELS,
  PROJECT_TYPE_LABELS,
  TIMELINE_LABELS,
  contactSchema,
  type ContactSubmission,
} from "@/lib/validation/contact";

export type ContactResult =
  | { success: true; data: { sent: true }; error: null }
  | {
      success: false;
      data: null;
      error: { message: string; fieldErrors?: Record<string, string[]> };
    };

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/* Per instance, in memory, lost on restart or redeploy, and not shared between
   instances. It raises the cost of a naive script. It is not abuse protection
   and must not be described as such. */
const submissions: RateLimitStore = new Map();

const GENERIC_FAILURE =
  "Something went wrong sending that. Please email me directly instead.";

function fail(
  message: string,
  fieldErrors?: Record<string, string[]>,
): ContactResult {
  return { success: false, data: null, error: { message, fieldErrors } };
}

/** Stable for a retry of the same submission, different for a genuine second
 *  one, and reveals nothing: the inputs are hashed, never sent. Resend expires
 *  these after 24 hours and caps them at 256 characters.
 *
 *  Every field that reaches the payload is in the hash. Resend rejects a reused
 *  key with a changed payload (409 `invalid_idempotent_request`), so a corrected
 *  resend must get a new key, while an identical retry keeps its key and dedupes.
 *
 *  `JSON.stringify` over a fixed-order array is the serialisation. It escapes
 *  embedded quotes, so no field can impersonate the boundary between two others,
 *  and it needs no separator byte, which would also make git treat this file as
 *  binary.
 *
 *  `website` is excluded. It is the honeypot, always empty on a valid
 *  submission, and not part of the enquiry. */
function idempotencyKey(submission: ContactSubmission): string {
  const canonical = JSON.stringify([
    submission.name,
    submission.email,
    submission.company ?? "",
    submission.projectType,
    submission.existingDesign,
    submission.timeline,
    submission.budgetRange ?? "",
    submission.message,
  ]);

  const digest = createHash("sha256")
    .update(canonical)
    .digest("hex")
    .slice(0, 32);

  return `contact-enquiry/${digest}`;
}

function plainTextBody(submission: ContactSubmission): string {
  /* `?? "not given"` on its own never fires for these. Both fields are
     optional, so the nullish branch only covers an omitted key, but the form
     always submits an empty string rather than omitting it. The empty string
     is the real "not given" case, so it has to be handled explicitly or the
     line reads `Budget:` followed by nothing. */
  const company =
    submission.company === undefined || submission.company === ""
      ? "not given"
      : submission.company;
  const budget =
    submission.budgetRange === undefined || submission.budgetRange === ""
      ? "not given"
      : BUDGET_RANGE_LABELS[submission.budgetRange];

  return [
    `Name:     ${submission.name}`,
    `Email:    ${submission.email}`,
    `Company:  ${company}`,
    `Project:  ${PROJECT_TYPE_LABELS[submission.projectType]}`,
    `Design:   ${EXISTING_DESIGN_LABELS[submission.existingDesign]}`,
    `Timeline: ${TIMELINE_LABELS[submission.timeline]}`,
    `Budget:   ${budget}`,
    "",
    submission.message,
  ].join("\n");
}

export async function submitContact(
  raw: unknown,
): Promise<ContactResult> {
  /* The honeypot is judged on the value that arrived, not on whether the schema
     produced an error for that field. Inferring it from `fieldErrors.website`
     would be wrong in a way that loses mail: a payload missing `website`
     altogether also produces an error there, so any malformed submission would
     be answered with a fake success and silently dropped. Only a field that is
     present and non-empty is a bot. */
  const rawHoneypot =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>).website
      : undefined;

  if (typeof rawHoneypot === "string" && rawHoneypot.trim() !== "") {
    /* Answered with the success shape. Telling a bot what tripped teaches it to
       leave the field alone next time. */
    return { success: true, data: { sent: true }, error: null };
  }

  /* Re-parsed here regardless of what the client did. The browser can post
     anything to a Server Action. */
  const parsed = contactSchema.safeParse(raw);

  if (!parsed.success) {
    return fail(
      "Some of those answers need another look.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const submission = parsed.data;

  const key = clientKey((await headers()).get("x-forwarded-for"));
  if (
    key !== null &&
    !checkRateLimit(submissions, key, Date.now(), RATE_LIMIT, RATE_WINDOW_MS).allowed
  ) {
    return fail(
      "That is a few messages in a short time. Please try again shortly, or email me directly.",
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    /* Fails closed. The log names no variable and prints no value, and the
       visitor is told to use the direct address rather than being told the
       site is misconfigured. */
    console.error("[contact] delivery is not configured; nothing was sent");
    return fail(GENERIC_FAILURE);
  }

  try {
    /* `emails.send` resolves to `{ data, error }` rather than throwing, so the
       error branch is the primary path. The try/catch is only for a
       network-level failure, which is a different class. */
    const { data, error } = await new Resend(apiKey).emails.send(
      {
        /* The sender stays the verified address; only the display name is the
           visitor's. A provider will not send from a domain you have not
           verified, and forging the visitor's address would fail SPF, DKIM and
           DMARC. `replyTo` below is what makes Reply reach them. */
        from: formatFromHeader(submission.name, from),
        to: [to],
        replyTo: submission.email,
        subject: `Project enquiry from ${submission.name}`,
        text: plainTextBody(submission),
      },
      /* Second argument, not part of the payload. Resend's own guide shows
         `idempotencyKey` inside the send options; the installed SDK types put
         it on `CreateEmailRequestOptions`, where it becomes the
         `Idempotency-Key` header. The types are what compiles. */
      { idempotencyKey: idempotencyKey(submission) },
    );

    if (error !== null) {
      /* Logged for the operator, never returned: provider strings leak
         implementation detail and sometimes the payload. */
      console.error("[contact] provider rejected the send:", error.name);
      return fail(GENERIC_FAILURE);
    }

    if (data === null) {
      console.error("[contact] provider returned neither an id nor an error");
      return fail(GENERIC_FAILURE);
    }

    /* The provider's id, and nothing else. No name, address or message body
       ever reaches a log. It is here so an operator tracing a delivery has
       something to search Resend for. */
    console.info("[contact] delivered:", data.id);

    return { success: true, data: { sent: true }, error: null };
  } catch {
    /* Deliberately does not touch the caught value. It can carry request
       details, and nothing here needs them. */
    console.error("[contact] the send failed at the network level");
    return fail(GENERIC_FAILURE);
  }
}
