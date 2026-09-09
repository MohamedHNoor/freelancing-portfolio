"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { Resend } from "resend";
import { formatFromHeader } from "@/lib/links";
import { checkRateLimit, type RateLimitStore } from "@/lib/rate-limit";
import {
  PROJECT_TYPE_LABELS,
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
 *  Every field that reaches the payload is in the hash. Keying it to `email` and
 *  `message` alone was wrong in a way that lost mail: a visitor who resent the
 *  same message after correcting the timeline, or after adding the budget they
 *  forgot, reused an existing key with a changed payload. Resend answers that
 *  with a 409 `invalid_idempotent_request`, which lands in the provider-error
 *  branch below, so the corrected enquiry was dropped and the visitor was told
 *  only that something went wrong. Keys live 24 hours, so retrying did not help.
 *  An identical retry still produces an identical key and still dedupes.
 *
 *  `JSON.stringify` over a fixed-order array is the serialisation. It escapes
 *  embedded quotes, so no field can impersonate the boundary between two others,
 *  and it needs no separator byte. The previous version used a literal U+0000
 *  for that, which was invisible to read but made git classify this whole file
 *  as binary: `git diff` printed only "Binary files differ" and `grep` refused
 *  to match, on the most security-sensitive file in the project.
 *
 *  `company` is excluded. It is the honeypot, always empty on a valid
 *  submission, and not part of the enquiry. */
function idempotencyKey(submission: ContactSubmission): string {
  const canonical = JSON.stringify([
    submission.name,
    submission.email,
    submission.projectType,
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
  /* `?? "not given"` on its own never fired. The field is optional, so the
     nullish branch only covers an omitted key, but the form always submits an
     empty string rather than omitting it. The empty string is the real "not
     given" case, so it has to be handled explicitly or the line reads
     `Budget:` followed by nothing. */
  const budget =
    submission.budgetRange === undefined || submission.budgetRange === ""
      ? "not given"
      : submission.budgetRange;

  return [
    `Name:     ${submission.name}`,
    `Email:    ${submission.email}`,
    `Project:  ${PROJECT_TYPE_LABELS[submission.projectType]}`,
    `Timeline: ${submission.timeline}`,
    `Budget:   ${budget}`,
    "",
    submission.message,
  ].join("\n");
}

export async function submitContact(
  raw: unknown,
): Promise<ContactResult> {
  /* The honeypot is judged on the value that arrived, not on whether the schema
     produced an error for that field. Inferring it from `fieldErrors.company`
     was wrong in a way that lost mail: a payload missing `company` altogether
     also produces an error there, so any malformed submission was answered with
     a fake success and silently dropped. Only a field that is present and
     non-empty is a bot. */
  const rawCompany =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>).company
      : undefined;

  if (typeof rawCompany === "string" && rawCompany.trim() !== "") {
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

  const forwardedFor = (await headers()).get("x-forwarded-for");
  const key = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(submissions, key, Date.now(), RATE_LIMIT, RATE_WINDOW_MS)
    .allowed) {
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
        subject: `New enquiry from ${submission.name}`,
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
