# Feature: Contact

**From build-plan:** feature 10

**Branch:** feature/contact

**Status:** verified

## Goal

A qualifying enquiry form that reaches the developer's inbox: one Zod schema
shared by the client form and the Server Action, Resend delivery, and a direct
email fallback so the path is never a dead end.

This is the feature the whole site exists to feed. It is also the first one that
handles a stranger's text, holds a secret, and calls an external service, so it
is the first that is security sensitive under `qualityGates.regular`.

## Prerequisites, and their exact state

| Needed | State | Handled by |
|---|---|---|
| `resend` package | **not installed** | step 1 installs it |
| shadcn `form`, `input`, `textarea`, `select`, `label` | **not installed**, only badge, button, card, sheet exist | step 1 adds them |
| `RESEND_API_KEY` | **present in `.env`**, untracked and ignored | already done by the user |
| `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | **not set** | step 1 documents them in `.env.example`; the action fails closed without them |
| `.env.example` committable | **no**: `.gitignore` line 34 is `.env*`, which ignores it too | step 1 adds a `!.env.example` negation |
| `profile.links.email` | **empty string** | see the fallback problem below |
| Resend verified sender domain | unknown, user-owned | not blocking: development can use Resend's shared sender |

`zod`, `react-hook-form` and `@hookform/resolvers` are already installed.

## In scope

- `src/lib/validation/contact.ts`: one Zod schema, imported by both the client
  form and the action
- `src/lib/rate-limit.ts`: a pure, injectable-clock limiter, with tests
- `src/actions/contact.ts`: the Server Action, returning the standards'
  `{ success, data, error }` shape
- `src/components/contact/ContactForm.tsx`: the client island
- `/contact` route carrying the form
- A home page contact section: the pitch, a link to `/contact`, and the direct
  email fallback
- The hero's `Start a project` button and the `Contact` nav item pointed at
  `/contact`
- `.env.example` documenting all four variables by name, with no values
- `.gitignore` fixed so `.env.example` can be committed while `.env` stays out

## Out of scope

- **`sonner` and a toast.** The result is announced inline in a `role="status"`
  region beside the form. A toast that disappears is the wrong place for
  "your message was sent" or for an error the visitor needs to act on, and
  neither `project-plan.md` nor the overview lists `sonner` in the stack. The
  original planning note did; this is a deliberate departure, recorded here.
- **Persisting submissions.** The overview is explicit: validated, forwarded by
  email, never stored. No database, no logging of message contents.
- **Durable rate limiting.** The plan asks for a light per-instance limit. In
  memory, per instance, reset on deploy. It raises the cost of a script; it is
  not a security control and must not be described as one.
- Canonicals, sitemap, structured data. Feature 11.
- Editing `src/content/profile.ts` to add the email. The user owns that.

## Build loop

`workflow.stepReview` is `feature`, `workflow.checkpointCommits` is `disabled`.

**Independent review is selected for this feature.** `qualityGates.regular`
sets it to `when-sensitive`, and this work carries a secret, an external side
effect, and a stranger's personal data, which are three of the named sensitive
categories. `review.independentExecution` is `automatic`, so after the final
Verify passes, `/implement` must prepare the review checkpoint, ask for explicit
commit approval, and run the isolated reviewer before the final packet. Do not
treat this as optional and do not self-review.

## Build steps

- [x] 1. **Dependencies, generated components, and environment plumbing.**
  `npm i resend`. `npx shadcn@latest add form input textarea select label`.
  Add `.env.example` listing `RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
  `CONTACT_FROM_EMAIL` and `NEXT_PUBLIC_SITE_URL` by name with empty values and
  a comment each. Add `!.env.example` to `.gitignore` after the `.env*` line.
  **Done when:** `git check-ignore .env` still matches and
  `git check-ignore .env.example` no longer does; `git status` shows
  `.env.example` as untracked-and-addable and never shows `.env`; the five
  shadcn files exist under `src/components/ui/`; `npx tsc --noEmit` and
  `npm run lint` clean. Record whether the shadcn CLI touched `globals.css`,
  `package.json` or `package-lock.json` beyond adding the components, by
  checksumming each before and after.

- [x] 2. **Schema and rate limiter, with tests.**
  Add `src/lib/validation/contact.ts` and `src/lib/rate-limit.ts` per Data /
  contracts, plus `tests/lib/validation/contact.test.ts` and
  `tests/lib/rate-limit.test.ts`.
  **Done when:** `npm test` passes with the new cases and the existing 102 still
  green; the limiter takes `now` as a parameter so no test depends on the wall
  clock.

- [x] 3. **The Server Action.**
  Add `src/actions/contact.ts`.
  **Done when:** with `CONTACT_TO_EMAIL` unset the action returns
  `{ success: false }` with a friendly message and sends nothing, proven by
  calling it directly; a payload failing the schema returns field errors and
  sends nothing; a payload with a non-empty `company` returns the same shape as
  a success and sends nothing; no provider error text, no environment variable
  name and no message body appears in any returned value; **and a valid payload
  actually delivers**, using Resend's own test recipients rather than an invented
  address, with the returned id recorded.

- [x] 4. **The form.**
  Add `src/components/contact/ContactForm.tsx`.
  **Done when:** every field has a visible label tied to its control; an invalid
  submit moves focus to the first invalid field and each error is tied to its
  input with `aria-describedby` and `aria-invalid`; the honeypot is present,
  labelled for assistive technology, and hidden from sighted users without using
  `display: none` on a focusable control; the submit button disables while
  pending; the result lands in a `role="status"` region; browser evidence at 390
  and 1440.

- [x] 5. **Routes and entry points.**
  Add `src/app/contact/page.tsx` and `src/components/sections/Contact.tsx`;
  point `NAV_ITEMS` Contact and the hero's `Start a project` at `/contact`.
  **Done when:** `/contact` returns 200 with one `h1` and the form; the home page
  ends with a contact section linking to it; **no navigation item, hero button or
  footer link anywhere on the site still points at `/#contact`**, verified by
  grepping the built HTML; `aria-current="page"` marks Contact on `/contact`.

- [x] 6. **Verification.**
  **Done when:** `npx tsc --noEmit`, `npm run lint`, `npm test` and
  `npm run build` all pass; `/contact` is `○ (Static)` and `/` still is; the
  chunk-byte total for `/` and `/contact` is recorded, with the increase from
  `react-hook-form` and `zod` attributed; keyboard-only pass through the whole
  form; 390, 768 and 1440 in both themes with no horizontal overflow; console
  clean.
- [x] 7. **F-01: quote the `From` display name.**
  `formatFromHeader` enumerates unsafe characters and misses `,`, the RFC 5322
  `mailbox-list` separator, so `Lovelace, Ada` and `x@attacker.test, Ada` both
  produce a two-mailbox `From`. Stop enumerating and quote instead: the existing
  pass already removes `"` and `\`, the only two characters that can break out of
  a quoted string, so `"<display>" <address>` is safe and tolerates `,` `:` `@`
  legitimately.
  **Done when:** `formatFromHeader("Lovelace, Ada", addr)` yields exactly one
  mailbox; the "exactly one address" test counts mailboxes rather than `<`
  characters and covers the comma cases; `npm test` green.

- [x] 8. **F-02, F-03 and F-05: key the idempotency hash to the whole submission.**
  The key hashes `email` and `message` only, while the payload also carries
  `name` (twice), `projectType`, `timeline` and `budgetRange`. A corrected
  resubmission inside 24 hours therefore reuses a key with a different payload,
  which Resend answers with a 409 `invalid_idempotent_request`, handled as a
  generic provider error, losing a real enquiry. Hash a stable serialisation of
  the validated submission instead. The literal U+0000 separator (F-03) goes with
  it, which restores `git diff` and `grep` on the file. Remove the unreachable
  `"not given"` budget fallback (F-05) or make it reachable.
  **Done when:** two submissions differing only in `timeline` produce different
  keys and an identical retry produces the same key, both covered by tests;
  `git diff` renders `src/actions/contact.ts` as text and `grep` matches it;
  `npm test` green.

- [x] 9. **F-04: bound the rate-limit store.**
  `checkRateLimit` prunes timestamps but never deletes an entry, so the map grows
  one key per distinct `x-forwarded-for` value for the life of the process, with
  no ceiling. Delete an entry whose pruned `hits` are empty, and cap the store so
  a spoofed header cannot grow it without limit.
  **Done when:** a key whose window has fully elapsed is absent from the store
  rather than present-and-empty; the store never exceeds its cap; both proven
  with the injected `now`; `npm test` green.

- [x] 10. **F-06 and record drift: correct the stale documentation.**
  The fallback comment on `/contact` says every `profile.links` value is the
  empty string, which its own commit contradicts. The spec's verification record
  says 152 tests where the suite now reports more.
  **Done when:** neither statement is contradicted by the tree.

## Files / areas

**New**

| Path | Kind |
|---|---|
| `src/lib/validation/contact.ts` | pure schema, shared |
| `src/lib/rate-limit.ts` | pure logic |
| `src/actions/contact.ts` | `"use server"` |
| `src/components/contact/ContactForm.tsx` | `"use client"` |
| `src/components/sections/Contact.tsx` | server |
| `src/app/contact/page.tsx` | server, static |
| `.env.example` | committed, names only |
| `tests/lib/validation/contact.test.ts`, `tests/lib/rate-limit.test.ts` | Vitest |

**Modified**

| Path | Change |
|---|---|
| `.gitignore` | `!.env.example` negation |
| `src/lib/site.ts` | Contact points at `/contact` |
| `src/app/page.tsx` | render the Contact section |
| `src/components/sections/Hero.tsx` | `Start a project` points at `/contact` |
| `package.json`, `package-lock.json` | `resend` plus shadcn peer deps |

## Data / contracts

### The submission

One schema in `src/lib/validation/contact.ts`, imported by the form and the
action. The action re-parses the raw payload; it never trusts a client-side
result.

| Field | Rule |
|---|---|
| `name` | trimmed, 2 to 100 chars, CR and LF replaced with a space |
| `email` | trimmed, lowercased, valid address, max 254 chars |
| `projectType` | one of `figma-conversion`, `saas-build`, `other` |
| `timeline` | trimmed, 1 to 100 chars |
| `budgetRange` | optional, trimmed, max 100 chars, never rendered publicly |
| `message` | trimmed, 20 to 5000 chars |
| `company` | honeypot, must be empty |

`PROJECT_TYPES` is exported as a `const` tuple so the select options and the
enum cannot drift apart.

**Why CR and LF are stripped from `name`:** it is the only user value that
reaches the subject line. Resend takes JSON rather than raw SMTP, so this is not
the classic header-injection hole, but a value that ends up in a header gets
sanitised at the boundary regardless.

### The action result

```ts
type ContactResult =
  | { success: true; data: { sent: true }; error: null }
  | { success: false; data: null; error: { message: string; fieldErrors?: Record<string, string[]> } };
```

- `message` is always written for a human and never carries a provider string,
  a stack, or an environment variable name.
- `fieldErrors` is present only for a schema failure, keyed by field name so the
  form can attach each one to its input.
- **A tripped honeypot returns the success shape** and sends nothing. Telling a
  bot it was caught teaches it to try again without the field.

### Email

- Plain text only. No HTML body, so no escaping question and no injection
  surface from the message.
- `replyTo` is the submitter's address, so replying works from the inbox.
  **camelCase**: the Node SDK uses `replyTo` and `scheduledAt`, not the snake_case
  the HTTP API documents. `reply_to` is silently ignored.
- Subject: `New enquiry from <name>`, using the sanitised name.
- Body carries every field including `budgetRange`, which is for scoping and is
  never rendered on the site.

### Failure and configuration

- Missing `RESEND_API_KEY`, `CONTACT_TO_EMAIL` or `CONTACT_FROM_EMAIL`: return
  `success: false` with a friendly message, send nothing, and log server-side
  that configuration is incomplete **without naming which variable or printing
  any value**.
- `resend.emails.send` resolves to `{ data, error }` rather than throwing, so the
  `error` branch is the primary path and must be handled explicitly. Resend's own
  guidance is not to reach for try/catch here; keep one only for network-level
  failures, which are a different class from an API error.
  Success is `{ data: { id }, error: null }`; failure is
  `{ data: null, error: { message, name } }`. Neither `message` nor `name` may
  reach the browser.
- Pass an `idempotencyKey` so a retried submit cannot deliver twice. Keys expire
  after 24 hours, cap at 256 characters, and follow `<event-type>/<entity-id>`;
  use `contact-enquiry/` plus a hash of the submitted email and message so the
  same submission retried is the same key while two genuine enquiries are not.
- Resend's own limit is 10 requests per second per team, answered with a 429.
  Treat a 429 as a transient failure with a friendly retry message, not as a
  validation error.
- Never log the message body, the email address, or the name.

### Rate limiting

`src/lib/rate-limit.ts` exports a pure function taking the store, a key, `now`
and the window, so it is testable without the wall clock. The action keys it on
the first entry of `x-forwarded-for` and falls back to a constant when absent.

**Three submissions per ten minutes per key.** In memory, per instance, lost on
restart. It raises the cost of a script and nothing more; do not describe it as
abuse protection.

## Testing

**`tests/lib/validation/contact.test.ts`**
- a valid payload parses, and the parsed values are trimmed and the email lowercased
- each field rejected at its boundary: name at 1 and 101, message at 19 and 5001,
  email malformed, timeline empty, `budgetRange` at 101
- `budgetRange` absent is valid
- an unknown `projectType` is rejected; each of the three valid ones is accepted
- a non-empty `company` is rejected
- CR and LF in `name` become spaces
- error messages are human-readable, not Zod defaults

**`tests/lib/rate-limit.test.ts`**
- the first three calls in a window pass, the fourth is limited
- a call after the window has elapsed passes again
- two different keys do not affect each other
- the store is not mutated for a rejected call in a way that extends the block
- `now` is injected, so no test reads the clock

## Notes for the AI

**Decisions taken.**

1. **The form lives at `/contact`; the home page gets a section that links to
   it.** Every navigation item became a route in feature 9, and putting the same
   form on two URLs would mean two analytics targets and a canonical decision for
   feature 11. See Open questions: this is the one call worth confirming before
   the form is built, because moving it later is more than a copy and paste.
2. **Inline status, not a toast.** See Out of scope.
3. **The honeypot is hidden without `display: none`.** A visually hidden
   focusable input still has to be reachable and labelled for assistive
   technology, and `display: none` would remove it from the tab order in a way
   some bots detect. Use the same `sr-only` treatment the skip link uses, plus
   `tabIndex={-1}` and `autoComplete="off"`.
4. **No `useActionState` assumption.** Pick whichever submission mechanism the
   installed React and Next versions actually support, and confirm against the
   Context7 docs for the exact version in `package.json` rather than from
   memory. The form is the one part of this feature where the framework API has
   moved recently.

**Resend specifics, from the vendor documentation the user supplied.**

- The SDK is `resend`, the export is `Resend`, parameters are camelCase.
- **Test recipients exist and must be used instead of invented addresses:**
  `delivered@resend.dev`, `bounced@resend.dev`, `complained@resend.dev` and
  `suppressed@resend.dev`. This is what makes step 3's happy path observable
  without a verified domain, so set `CONTACT_TO_EMAIL=delivered@resend.dev` in
  local `.env` while building. Do not put a value in `.env.example`.
- `onboarding@resend.dev` is a valid `from` **for development only**. Production
  requires a verified domain, which the user has not confirmed. Record it as a
  feature 13 deployment gate: a production `CONTACT_FROM_EMAIL` still pointing at
  `resend.dev` means enquiries are being sent from a test sender.

**Constraints carried in from earlier features.**

- Every list needs `role="list"`.
- One `h1` per page; `/contact` owns its own through `PageHeader`.
- Page padding `py-12 sm:py-14 lg:py-16`, container `max-w-6xl`.
- Server components by default. `ContactForm` is the only new client island.
- `NavLink` marks a route item current; Contact becomes markable in step 5.

**The fallback problem, which this feature cannot fix.** The coding standards
require that missing configuration produces "a clear message and a working
fallback". The fallback is the direct email address, and
`profile.links.email` was the empty string at spec time, so `getProfileLinks()`
returned nothing and the fallback rendered nothing. **Resolved during the
feature:** a real address was supplied, and the fallback now renders. Until the user supplies a real address,
a visitor who hits the fail-closed path has **no way to make contact at all**,
which is the exact dead end the plan set out to avoid. Build the fallback so it
appears the moment an address exists, and say plainly in the review packet that
the site must not launch without one.

**Do not read `.env`.** It holds a live `RESEND_API_KEY`. Its variable names are
already known and recorded above; nothing in this feature needs its values.
Never print, echo, copy or commit them, and never add a value to `.env.example`.

## Open questions

- **Should the form be on `/contact`, on the home page, or both?** The plan's
  feature list says "Contact section", written before feature 9 turned every
  navigation item into a route. This spec builds the form at `/contact` with a
  linking section on the home page, which matches how projects, skills and the
  rest now work. The alternative worth weighing is the form inline at the foot of
  the home page, where a visitor who has just read everything is at peak intent
  and one click is real friction. Confirm before step 4; after that the form is
  built and moving it means rewriting its container and both entry points.


## Verification record

| Check | Method | Result |
|---|---|---|
| Typecheck, lint, build | real exit codes | PASS |
| Tests | `npm test` | PASS, **171** across 8 files, 69 added |
| Route table | build output | `/contact` `○ (Static)`, every other route unchanged |
| `.env` safety | `git add --dry-run` | `.env` refused by gitignore; `.env.example` addable; no values in the example |
| No `#contact` anywhere | grep of `src/` and every prerendered page | none |
| Fail closed | mocked action tests, all three variables | returns failure, sends nothing, names no variable |
| Honeypot | mocked action test | success shape returned, nothing sent |
| Provider error | mocked action test | neither `message` nor `name` reaches the caller |
| Network throw | mocked action test | caught, nothing leaked |
| Rate limit | mocked action test | fourth submission in the window blocked, three sends made |
| **Live delivery** | real submit at `/contact` | **succeeded**: success message shown, form cleared, no errors |
| Labels | browser | all seven fields have a `label[for]` |
| Invalid submit | browser | four fields marked `aria-invalid`, focus moved to `name`, every error wired by `aria-describedby` |
| Tab order | browser | name, email, projectType, timeline, budgetRange, message, submit; each with a visible ring; honeypot correctly skipped |
| `aria-current` | browser | Contact marked on `/contact` |
| Responsive | 390, 768, 1440 across two routes, both themes | no overflow in any of the twelve |
| Console | Playwright listener | no errors, no warnings |
| First-load JS | chunk-byte sum | `/contact` 836,925 bytes against 730,940 for `/about`: **+106KB** for react-hook-form, zod and the resolver. `/` is 754,803 |

### A bug the tests caught, worth recording

The honeypot was first judged from `fieldErrors.company`. A payload with **no
`company` key at all** also produces an error on that field, so any malformed
submission was answered with the success shape and silently discarded. A visitor
would have seen "that reached my inbox" while nothing was sent.

Found by the "re-validates rather than trusting the caller" test, which posted
`{ garbage: true }` and got `success: true`. The check now reads the value that
arrived: only a field that is **present and non-empty** is a bot. A regression
test covers the missing-key case.

This is the failure mode the honeypot's design makes dangerous, because its
correct behaviour is to lie about success.

### The sender address, after the user's correction

The user asked for `CONTACT_FROM_EMAIL` to be the address the visitor types.
That cannot work and was not done. A provider only sends from a domain the
sender has verified: Resend rejects anything else with `invalid_from_address`,
and a forged sender fails SPF, DKIM and DMARC even where a provider allows it.

What the request actually wanted is already how it works, and is now more
visible:

- `replyTo` is the visitor's address, so Reply in the inbox reaches them. This
  was in the action from the start.
- `from` is now `formatFromHeader(name, CONTACT_FROM_EMAIL)`, so the inbox shows
  `Ada Lovelace <enquiries@verified-domain>` rather than the bare address. The
  sender stays an address the site controls.

`formatFromHeader` is a security boundary: the display name is user-controlled
text landing in a mail header. `"`, `\`, `<`, `>` and every control character
are replaced with a space, runs of whitespace collapse, and a name that
sanitises away falls back to the bare address. Eight tests cover it, including
`Ada <evil@attacker.test>` and a CRLF `Bcc:` attempt, both asserted to leave
exactly one address in the header.

Re-verified with a second live send after the user added their verified domain:
delivered, form cleared, no errors.

### Deviations from the spec as written

1. **No shadcn `form` component.** The configured registry does not provide one;
   `npx shadcn add form` completes and creates nothing. React Hook Form is wired
   directly, with every `aria-invalid` and `aria-describedby` written explicitly,
   which step 4's done-when required in any case.
2. **A native `<select>`, and `select.tsx` deleted.** Three options, a real
   mobile picker, no `Controller` layer. The generated Radix select was removed
   rather than left unused.
3. **`idempotencyKey` is the second argument to `send`, not part of the
   payload.** Resend's own guide shows it inside the send options; the installed
   SDK v6.26.0 types put it on `CreateEmailRequestOptions`. The types are what
   compiles.
4. **`CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL` were appended to the local
   `.env`** with Resend's documented test values, on the user's explicit
   approval, to make the live send possible. Appended only, nothing overwritten,
   and the file remains ignored.
5. **The delivery id is logged.** One line, the provider id only, so an operator
   can trace a send. No name, address or message body reaches any log.

### Carried forward

- **The fallback still renders nothing.** `profile.links.email` is the empty
  string, so a visitor who hits the failure path has no way to make contact.
  This contradicts the coding standard requiring "a clear message and a working
  fallback". **The site must not launch without a real address.**
- **`CONTACT_FROM_EMAIL` now points at the user's verified domain**, and a live
  send through it succeeded. Feature 13 should still assert that production is
  not pointing at `resend.dev`.
- The rate limiter is per instance and in memory. It is not abuse protection.


## Findings

### 10/F-01 [P1] closed - The From display-name sanitiser leaves the comma, which is the character that starts a new address

**File:** src/lib/links.ts:65
**Found:** 2026-09-09 by /audit (scope: current; lens: security)
**Why it matters:** `formatFromHeader` documents itself as the boundary that
replaces "the characters that could terminate the quoted string or start a new
address". It strips `"`, `\`, `<`, `>` and controls, but not `,`. In RFC 5322 a
`From` value is a `mailbox-list`, and the comma is exactly what separates one
mailbox from the next, so an unquoted display name containing a comma splits the
header. Reproduced against the shipped regex:

- `formatFromHeader("x@attacker.test, Ada", addr)` returns
  `x@attacker.test, Ada <hi@example.com>`, which parses as two mailboxes, only
  the second of which is the address the site controls.
- An ordinary visitor typing `Lovelace, Ada` produces
  `Lovelace, Ada <hi@example.com>`, a `From` with a bare non-address mailbox in it.

`name` is anonymous, unauthenticated input, and the schema does not restrict the
character set, so both are reachable from the public form. Whether Resend rejects
the malformed value or forwards it is provider-side and was not verified (no
external calls were made during this review): rejection loses a real enquiry
behind the generic failure message, acceptance puts a second sender address in
the header. Neither outcome is what the boundary claims.

The existing test `leaves exactly one address in the header`
(tests/lib/links.test.ts:117) does not catch this. It counts `<` and `>`
characters rather than mailboxes, so the comma case above still passes it while
the header carries two addresses. Also unstripped: `:` and `@`, which are
`specials` and are likewise invalid in an unquoted phrase.

**Suggested fix:** Quote the display name instead of trying to enumerate unsafe
characters: after the existing pass strips `"` and `\`, emit
`"<display>" <address>`. A quoted-string tolerates commas, colons and `@`
legitimately, and the two characters that could break out of it are already
removed. Then extend the "exactly one address" test to assert on comma input and
to count addresses rather than angle brackets.
**Resolution:** Fixed in step 7. `formatFromHeader` now quotes the display name (`"<display>" <address>`) instead of enumerating unsafe characters, so `,`, `:` and `@` are legitimate inside the quoted-string and cannot start a second mailbox; `"`, `\`, `<`, `>` and controls are still replaced first, so nothing can break out of the quotes. The weak test was replaced: it now asserts the whole value matches a single-mailbox pattern rather than counting `<` characters, across five inputs including `Lovelace, Ada` and `x@attacker.test, Ada`. A non-ASCII display name is still passed through as UTF-8 rather than RFC 2047 encoded, which is unchanged by this fix and recorded as a known limit in the function's doc comment.

Re-reviewed 2026-09-09 by /audit (independent; scope: current; lens: quality, security, performance, tests). Confirmed closed against `src/lib/links.ts:78-85`. The display name is now emitted inside a quoted-string, and `"`, `\`, `<`, `>` and every byte in U+0000-U+001F plus U+007F are replaced before the quotes go on, so nothing can break out of them and `,` can no longer start a second mailbox. Re-derived the original defect independently of the suite, against the shipped regex: all ten probe inputs now yield exactly one mailbox, including `Lovelace, Ada`, `x@attacker.test, Ada`, `Ada; Bcc: e@a.test`, `Ada <evil@attacker.test>`, a CRLF `Bcc:` attempt and a trailing `Ada,`, and a name that sanitises away still falls back to the bare address. The weak assertion is genuinely gone: `tests/lib/links.test.ts` now matches the whole value against a single-mailbox pattern instead of counting `<`, and the comma cases are in it. The non-ASCII RFC 2047 limit is recorded in the doc comment and is provider-side, not a defect in this boundary.

### 10/F-02 [P1] closed - The idempotency key covers two of six fields, so a corrected resubmission is rejected and the enquiry is lost

**File:** src/actions/contact.ts:43
**Found:** 2026-09-09 by /audit (scope: current; lens: quality)
**Why it matters:** `idempotencyKey` hashes only `submission.email` and
`submission.message`. The payload actually sent also carries `from` (built from
`name`), `subject` (built from `name`), and a `text` body containing
`projectType`, `timeline` and `budgetRange`. So a visitor who submits, then
within 24 hours resubmits the same message from the same address after
correcting their name, the project type, the timeline, or adding the budget they
forgot, sends a **different payload under an existing key**.

Resend's documented behaviour for that case is a 409 `invalid_idempotent_request`
(https://resend.com/docs/dashboard/emails/idempotency-keys; the identical-payload
case returns the original response without resending, which is the intended
path). The action handles it at src/actions/contact.ts:139 as an ordinary
provider error: the visitor gets `GENERIC_FAILURE` and the corrected enquiry
never arrives. Keys live for 24 hours, so a retry an hour later fails the same
way.

This also misses the spec's own stated contract for the key: "the same
submission retried is the same key while two genuine enquiries are not". A
corrected resubmission is a genuine second enquiry and currently shares a key.
On the one path the entire site exists to feed, this converts a recoverable user
action into a dead end.

**Suggested fix:** Hash the whole validated submission rather than two fields,
for example a stable JSON serialisation of `submission`. An identical retry still
produces an identical key and still dedupes; a corrected one gets a new key and
delivers. Add a test asserting that changing only `timeline` (or `name`) yields a
different key.
**Resolution:** Fixed in step 8. The key now hashes a `JSON.stringify` of a fixed-order array of every field that reaches the payload (name, email, projectType, timeline, budgetRange, message); `company` is excluded as the honeypot. An identical retry still dedupes, and four `it.each` cases prove a change to name, projectType, timeline or budgetRange alone yields a different key. An omitted and an empty `budgetRange` hash identically, also covered.

Re-reviewed 2026-09-09 by /audit (independent; scope: current; lens: quality, security, performance, tests). Confirmed closed against `src/actions/contact.ts:62-78`. The key hashes a `JSON.stringify` of a fixed-order array of all six fields that reach the payload. Re-derived independently: an identical retry produces an identical key; a change to any one of `name`, `email`, `projectType`, `timeline`, `budgetRange` or `message` alone produces a different key; an omitted and an empty `budgetRange` hash identically; no field's content can impersonate another field's boundary, because `JSON.stringify` escapes embedded quotes; and the key is 48 characters against Resend's 256 cap. The corrected-resubmission dead end is gone.

### 10/F-03 [P2] closed - A raw NUL byte makes the Server Action a binary file to git, grep and code review

**File:** src/actions/contact.ts:45
**Found:** 2026-09-09 by /audit (scope: current; lens: quality)
**Why it matters:** The hash separator on line 45 is written as a literal U+0000
byte inside the template literal rather than the `\0` escape. It is the only
non-printable byte in the file, and it is enough for git's binary heuristic to
classify the whole module. Consequences, all reproduced:

- `git diff dd95c54..5df6047 -- src/actions/contact.ts` prints
  `Binary files /dev/null and b/src/actions/contact.ts differ` and no content.
  The most security-sensitive file in the project is invisible in the diff a
  reviewer or a pull request would read.
- `git grep`, `git blame` and plain `grep` return only "Binary file matches";
  every search of this file needs `grep -a`.
- Git cannot do a textual three-way merge on it, so any future conflict here has
  to be resolved as a binary file.

The code itself is valid and the build, typecheck and tests all pass, so this is
a tooling and reviewability defect rather than a runtime one, but it defeats
diff-based review on exactly the file that most needs it.

**Suggested fix:** Replace the literal byte with the escape: `` `${submission.email}\0${submission.message}` ``.
The hash input is byte-identical, so no key changes, and the file becomes text
again. (If F-02 is fixed by hashing a serialised submission, the separator
disappears entirely.)
**Resolution:** Fixed in step 8. The literal U+0000 separator is gone entirely: `JSON.stringify` escapes embedded quotes, so no field can impersonate a boundary and no separator byte is needed. The file now contains zero NUL bytes and `grep` matches it again. `git diff` will render it as text from the next commit onward; it still reports binary against the current checkpoint because the committed side is the binary blob.

Re-reviewed 2026-09-09 by /audit (independent; scope: current; lens: quality, security, performance, tests). Confirmed closed. `src/actions/contact.ts` contains zero NUL bytes and no byte above 0x7F, `file` reports it as ASCII text, and `git diff dd95c546..88589c7e -- src/actions/contact.ts` renders the full 203 lines as text rather than "Binary files differ". `grep` matches the file without `-a`. The separator disappeared entirely rather than being escaped, which is the better of the two fixes offered.

### 10/F-04 [P2] closed - The rate-limit store never evicts a key, so it grows for the life of the instance

**File:** src/lib/rate-limit.ts:36
**Found:** 2026-09-09 by /audit (scope: current; lens: performance)
**Why it matters:** `checkRateLimit` prunes timestamps inside an entry but never
removes the entry itself. Both branches end in `store.set(key, ...)`, and there
is no path that deletes a key whose `hits` have all aged out. The module-scope
`submissions` map at src/actions/contact.ts:28 therefore only ever grows, one
entry per distinct key, for as long as the process lives. On a long-running host
(a container, `npm run start`, Render) that is an unbounded collection reachable
by anonymous traffic.

The key is the first entry of `x-forwarded-for`
(src/actions/contact.ts:97). In an appending proxy chain the leftmost element is
the value the client sent, so a caller can mint a fresh key per request and both
grow the map without limit and bypass the three-per-window ceiling. The spec is
explicit that this limiter is not abuse protection and this finding does not
argue otherwise: the point is the store has no upper bound at all, which is a
separate property from how strong the limit is. Practical growth is bounded by
the send path (the limiter runs after schema validation, so each new key also
costs a Resend send), so this is slow rather than acute.

**Suggested fix:** Delete the entry instead of writing it back when the pruned
`hits` array is empty, and give the store a size ceiling (evict the
oldest-touched key past, say, a few thousand entries) so a spoofed header cannot
grow it without limit. Both are testable with the injected `now` the module
already takes.
**Resolution:** Fixed in step 9. Two mechanisms, because they address different things: a sweep drops every entry whose last hit has aged out of the window (the actual leak), and `maxKeys`, default 5000, caps the rest (the backstop, needed because the key is a client-supplied header so a caller can mint fresh keys that never expire while in-window). Writes now delete-then-set so Map order is recency order and eviction takes the least recently touched key, not the oldest inserted. Five tests cover expiry of an idle key, expiry of a blocked key, the cap holding under 500 spoofed keys, LRU eviction order, and correct counting for a key that survives a sweep.

Re-reviewed 2026-09-09 by /audit (independent; scope: current; lens: quality, security, performance, tests). Confirmed closed against `src/lib/rate-limit.ts:39-60`. `sweep` deletes every entry whose newest hit has aged out of the window, then evicts from the front of Map iteration order until `store.size <= maxKeys`; every write in `checkRateLimit` deletes the key before setting it, so iteration order is recency order and eviction takes the least recently touched key. Both the allowed and the blocked branch sweep, so the store is bounded at `DEFAULT_MAX_KEYS` (5000) however many distinct keys arrive, which is what the finding asked for. Checked for repair-introduced defects and found none: deleting during Map iteration is well defined, the just-written key sits at the back and so is evicted last, the expiry test reads only the newest hit (sound, because `hits` is ordered), and `hits` itself cannot exceed `limit` because a rejected call is not recorded. Five tests cover idle expiry, blocked-key expiry, the cap holding across 500 spoofed keys, LRU eviction order, and correct counting for a key that survives a sweep. The finding was about the store having no upper bound, and it now has one. How the key is derived was outside this finding and is unchanged; a separate defect in that derivation is recorded as F-07.

### 10/F-05 [P3] closed - The "not given" budget fallback is unreachable from the real form

**File:** src/actions/contact.ts:57
**Found:** 2026-09-09 by /audit (scope: current; lens: quality)
**Why it matters:** `submission.budgetRange ?? "not given"` only fires when the
field is `undefined`. `budgetRange` is `z.string().trim().max(100).optional()`,
so an empty string parses to an empty string, not to `undefined`, and
`ContactForm` seeds the field with `defaultValues.budgetRange: ""`
(src/components/contact/ContactForm.tsx:48) and always submits it. Every enquiry
that leaves the budget blank therefore arrives with a bare `Budget:` line rather
than `Budget:   not given`. Cosmetic, in the developer's own inbox only, but the
fallback reads as tested when nothing exercises it.

**Suggested fix:** Either make the schema normalise empty to undefined
(`.transform((v) => (v === "" ? undefined : v))` after the length check) or
change the template to `submission.budgetRange || "not given"`.
**Resolution:** Fixed in step 8. `plainTextBody` now treats `undefined` and `""` alike as "not given", with a comment explaining why the nullish coalesce alone never fired. Covered by a test asserting the rendered `Budget:   not given` line.

Re-reviewed 2026-09-09 by /audit (independent; scope: current; lens: quality, security, performance, tests). Confirmed closed against `src/actions/contact.ts:86-89`. `plainTextBody` treats `undefined` and `""` alike, so the empty string the form always submits now renders `Budget:   not given` instead of a bare `Budget:` line. A test asserts that exact rendered line, so the branch is exercised rather than merely present.

## Independent review

**Status:** passed
**Target commit:** 88589c7e9d08e34537fac50fbe6455d778de6dcf
**Base commit:** dd95c5461338a3dd84bdd7e85769adbbdd5cc0e4
**Base ref:** main
**Spec hash:** 1d42cedc17e1b195759f2cc423d72189c0097388ebb864ebc84ca60b086751d7
**Prepared by:** claude
**Builder model:** claude-opus-5
**Requested reviewer:** claude
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-09-09T23:18:22Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-09T23:28:17Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `dd95c5461338a3dd84bdd7e85769adbbdd5cc0e4..88589c7e9d08e34537fac50fbe6455d778de6dcf` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

This is the second review of this work item. The first returned
changes-requested against target 5df604702ec6bddff4d097d2d811e72942ccfd2a with
six findings, F-01 to F-06, now marked `fixed` in the ledger. Judge each repair
against the code and move it to `closed` only where the evidence supports it.
The scope is the whole base..target delta, not only the repair commit.

### Commands

- `git rev-parse HEAD`, `git merge-base main HEAD`, `shasum -a 256 blueprint/context/current-feature.md`, `git status --porcelain`: pass (target, base, spec hash and tree state all match the request; only `blueprint/context/review.md` differs, which the freshness rules permit)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass (no output, exit 0)
- `npm test`: pass (171 tests, 8 files; matches the spec's verification record)
- `npm run build`: pass (`/contact` is `○ (Static)`, every other route unchanged)
- `/check`: not run, not required by the request

### Evidence

- Whole delta read file by file, 27 paths, excluding `blueprint/context/review.md` and `blueprint/context/findings.md` from the code scope. Both commits in range reviewed, not only the repair commit.
- F-01 re-derived independently of the suite: the shipped `formatFromHeader` regex run against ten adversarial and ordinary display names, every result a single mailbox or the bare-address fallback.
- F-02 re-derived independently: identical retry keys equal; a change to any one of the six payload fields yields a different key; omitted and empty `budgetRange` hash alike; no field can impersonate another's boundary; key length 48 against Resend's 256 cap.
- F-03 verified by byte inspection: zero NUL bytes, no byte above 0x7F, `file` reports ASCII text, and `git diff dd95c546..88589c7e -- src/actions/contact.ts` renders all 203 lines as text.
- F-04 verified by reading `sweep` and `checkRateLimit` for repair-introduced defects (Map mutation during iteration, eviction of the just-written key, the newest-hit expiry test, `hits` growth) plus the five new bounding tests.
- Trust-boundary check on the built client bundles: `api.resend.com`, `RESEND_API_KEY`, `contact-enquiry`, `node:crypto` and the generic failure string appear in zero files under `.next/static`, so the server module did not leak to the browser.
- Secret handling: `.env` not read at any point. `git check-ignore` confirms `.env` ignored and `.env.example` tracked; `.env.example` carries four names and no values.
- Running dev server read at http://localhost:3000: `/contact` returns 200 with one `h1`, seven `label[for]` bindings, `aria-current="page"` on the Contact nav item, and the `mailto:info@mohamedhnoor.com` fallback rendered. Zero `href="/#contact"` in the served home page or anywhere in `src/`.
- F-07 reproduced at the key-derivation expression: `null` keys on `"unknown"`, and `""`, `", 203.0.113.9"` and `"  , 203.0.113.9"` all key on `""`.
- No external action taken: no Resend call, no email sent, no network-backed tool run, no git state changed.

### Findings

- Closed this pass: F-01 (P1), F-02 (P1), F-03 (P2), F-04 (P2), F-05 (P3). Each re-examined against the repaired code, with the original defect re-derived and no repair-introduced defect found.
- Still `fixed`, not closed: F-06 (P3). The two code comments are repaired, but the spec half this finding's own Suggested fix named was not done: `blueprint/context/current-feature.md:458-461` still claims the fallback renders nothing, which `src/content/profile.ts:33` and the served page contradict, and `current-feature.md:348-352` now contradicts itself inside one paragraph. P3, so it does not block.
- New: F-07 (P2, open) every visitor shares one rate-limit bucket when `x-forwarded-for` is absent or its first element is empty, so on a host that does not set the header the three-per-ten-minutes limit is site-wide rather than per-visitor and refuses genuine enquiries. F-08 (P3, open) source comments narrate the replaced implementation and the review that replaced it, against the Comments section of the standards.
- No P0 finding. No P0 or P1 finding is `open` or `fixed`, which is why this receipt passes with F-06, F-07 and F-08 outstanding.

### Remaining risk

- No `Verify` command and no automatic GitHub checks are configured in this project, so there is no single umbrella gate; the four commands above were run individually.
- No `Browser tests` command is configured, so no browser was driven. Keyboard order, focus movement on an invalid submit, the `role="status"` announcement, both themes and the three breakpoints were not re-verified by this review; they rest on the builder's recorded evidence and on the served HTML read above.
- No security scanner and no dependency-vulnerability scan exists in this project and none was run. `resend` brings four new transitive packages (`postal-mime`, `standardwebhooks`, `fast-sha256`, `@stablelib/base64`); reading the lockfile is not a vulnerability scan.
- `/check` was not required and was not run, so spec acceptance criteria were not proven against the running app by this pass.
- No Resend call was made, by instruction. Three provider-side behaviours are therefore unverified: that Resend accepts the quoted `From` value, the 409 `invalid_idempotent_request` path that F-02 turned on, and the 429 rate-limit path. All three are exercised only through mocks in `tests/actions/contact.test.ts`.
- The non-ASCII display name in `formatFromHeader` is passed through as UTF-8 rather than RFC 2047 encoded. Documented as a known limit, provider-dependent, not verified here.
- F-07 and F-08 are open and unrepaired, and F-06 remains `fixed`. None blocks `/complete`, but F-07 carries a real risk to the conversion path on a deployment that does not set `x-forwarded-for`.
- The fallback address now renders, so the launch blocker the spec records under "Carried forward" is resolved in the code even though the text still says otherwise (F-06). Feature 13 should still assert that production `CONTACT_FROM_EMAIL` is not a `resend.dev` address.
- Reviewer adapter, model and fresh-subagent context are declared metadata. Blueprint proves the target and staleness; it cannot cryptographically prove a separate context performed this review.
