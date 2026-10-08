# Fix: Client detail loads and empty country text

**Type:** Fix

**Status:** verified

**Branch:** fix/client-detail-loads-and-empty-country-text

**Fixes:** F-34, F-35

## The problem

1. **F-34.** [The client detail page](../../src/app/dashboard/clients/[clientId]/page.tsx)
   awaits `getClient(userId, clientId)` and only then awaits
   `listClientActivity(userId, client.id)`. The activity query runs its own
   `ownedClient` check before its `findMany`, so every detail view makes three
   database round trips one after another after `requireOwner()`. Features 18 to
   22 will copy this pattern for their project, milestone and payment pages.
2. **F-35.** [`ClientTable`](../../src/components/dashboard/clients/ClientTable.tsx)
   shows a bare em dash (U+2014) in the Country column when a client has no
   country code. Screen readers read it as "em dash" or skip it, the detail page
   says "Not provided" for the same empty value, and the writing standard rules
   out em dashes in generated content.

## The fix

- **F-34:** start both loaders together with `Promise.all`, inside the page's
  existing `loadOrNotFound` wrapper.
  - Both are passed the route's `clientId`.
  - Both are owner-scoped and already raise `NotFoundError` for a missing,
    malformed or other-owner id, so the page still shows the scoped 404.
    Unexpected errors still reach `error.tsx`.
  - `listClientActivity` keeps its own ownership check. No query variant may
    skip it.
  - Each view then makes two round trips in sequence instead of three.
- **F-35:** render "Not provided" in muted text for an empty country cell,
  matching the detail page.
- **Must not break:**
  - The 404, archived-state and escaping behaviour that the existing page tests
    cover.
  - The 50-entry activity cap note.
  - axe-clean output.

## Build steps

- [x] **1. Load the client and its activity together**
  - Change `src/app/dashboard/clients/[clientId]/page.tsx`.
  - In `tests/app/dashboard/clients/pages.test.tsx`, add a case where
    `getClient` returns a promise that hasn't resolved yet, and assert
    `listClientActivity` was already called with `(ownerId, clientId)`. Add a
    case where only `listClientActivity` rejects with `NotFoundError`, which
    must still call `notFound()`.
  - **Done when:** `npx vitest run tests/app/dashboard/clients` passes,
    including every existing detail-page case.

- [x] **2. Say "Not provided" for an empty country**
  - Change `src/components/dashboard/clients/ClientTable.tsx`.
  - Add a list-page test where a client has no country code. It renders "Not
    provided" in that row and contains no U+2014.
  - **Done when:** the page tests pass, and `grep -rn "—"
    src/components/dashboard src/app/dashboard` finds no em dash in rendered
    output.

- [x] **3. Final gate**
  - **Done when:** `npx tsc --noEmit`, `npm run lint`, `npm test`,
    `npm run test:integration` and `npm run build` pass. F-34 and F-35 are
    marked `fixed` in `blueprint/context/findings.md` with resolution notes.

## Verify

- `npx vitest run tests/app/dashboard/clients`: both new cases pass alongside
  the existing ones.
- With `npm run dev` running and signed in:
  - `/dashboard/clients` shows "Not provided" in the Country column for a client
    with no country (the archived "Ana Fictional" under Archived).
  - A client's detail page still shows its details and activity.
  - `/dashboard/clients/not-a-uuid` still shows "Client not found".

## Findings

### client-detail-loads-and-empty-country-text/F-34 [P3] closed - The client detail page loads the client's ownership twice, in series

**File:** src/app/dashboard/clients/[clientId]/page.tsx:32
**Found:** 2026-10-09 by /audit (independent; scope: current; lens: performance)
**Why it matters:** The page awaits `getClient(userId, clientId)` (one `ownedClient` lookup), then awaits `listClientActivity(userId, client.id)`, which runs `ownedClient` again (`src/server/queries/activity.ts:12`) before its `findMany`. Every detail render therefore makes three sequential Neon round trips after `requireOwner()`, one of them a repeat of a lookup the page already holds the result of. Unmeasured and small at single-owner volume, but it is the pattern features 18 to 22 will copy for project, milestone and payment detail pages.
**Suggested fix:** Either run the two loaders with `Promise.all` (both already raise `NotFoundError` for a missing, malformed or foreign id), or give the activity query a variant that takes an already-owned client and skips the second ownership check.
**Resolution:** Fixed on `fix/client-detail-loads-and-empty-country-text` (2026-10-09): the detail page starts `getClient` and `listClientActivity` together with `Promise.all` inside `loadOrNotFound`, both with the route's `clientId`, so a view makes two sequential round trips instead of three. The activity query keeps its own `ownedClient` check. `tests/app/dashboard/clients/pages.test.tsx` proves the activity load starts before the client lookup resolves and that an activity-only `NotFoundError` still gives the scoped 404. Awaiting `/audit` re-review.

**Re-reviewed 2026-10-09 by /audit (independent; scope: current; lens: quality, security, performance, tests; 76d4c36..c91d5b4): closed.** `src/app/dashboard/clients/[clientId]/page.tsx:34-36` now awaits `Promise.all([getClient(userId, clientId), listClientActivity(userId, clientId)])` inside `loadOrNotFound`, so the critical path is `ownedClient` then `findMany` (two sequential round trips) with the parallel `getClient` lookup alongside. Passing the raw route id to `listClientActivity` is safe: it still runs `ownedClient` (`src/server/queries/activity.ts:13`), which rejects a malformed, missing or other-owner id with `NotFoundError` before any query that uses it, and the `findMany` filters on both `ownerId` and the owned `client.id`. `Promise.all` handles the second rejection, so no unhandled rejection; two concurrent queries fit the pool's `max: 5`. The new test would fail on the old serial code (activity is not called until `getClient` resolves) and the activity-only 404 and error-boundary cases pass. No new defect introduced.

### client-detail-loads-and-empty-country-text/F-35 [P3] closed - An empty country cell in the clients table renders a bare em dash

**File:** src/components/dashboard/clients/ClientTable.tsx:49
**Found:** 2026-10-09 by /audit (independent; scope: current; lens: quality)
**Why it matters:** A client without a country code shows a lone U+2014 in the Country column, which screen readers read as "em dash" or skip, while the detail page says "Not provided" for the same empty value. The writing standard also rules out em dashes in generated content.
**Suggested fix:** Render "Not provided" (or a visually short mark with sr-only "Not provided" text) so the list and detail pages describe an empty value the same way.
**Resolution:** Fixed on `fix/client-detail-loads-and-empty-country-text` (2026-10-09): `ClientTable` renders muted "Not provided" for a missing country code, matching the detail page; a list-page test asserts the text and the absence of U+2014, and no em dash remains under `src/components/dashboard` or `src/app/dashboard`. Awaiting `/audit` re-review.

**Re-reviewed 2026-10-09 by /audit (independent; scope: current; lens: quality, security, performance, tests; 76d4c36..c91d5b4): closed.** `src/components/dashboard/clients/ClientTable.tsx:49` renders `<span className="text-muted-foreground">Not provided</span>` for a null `countryCode`, the same wording and muted style as the detail page's empty value (`page.tsx:122`). `grep -rn "—" src/components/dashboard src/app/dashboard` finds nothing. The list-page test asserts `>Not provided</span>` and the absence of U+2014. No new defect introduced.

## Independent review

**Status:** passed
**Target commit:** c91d5b4fee259fc926d723e5c1291365eae41eb0
**Base commit:** 76d4c3681f0dcd52c8b60aa3ab0956f7561aa892
**Base ref:** main
**Spec hash:** a1687151caec6033a57f0bccd363bd3a78e36f4e0bf37582f648f61625a3c7de
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-08T15:20:28Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-08T15:21:41Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `76d4c3681f0dcd52c8b60aa3ab0956f7561aa892..c91d5b4fee259fc926d723e5c1291365eae41eb0` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm test`: pass (42 files, 708 tests)
- `npm run test:integration`: pass (3 files, 15 tests, local `portfolio_test`)
- `npm run build`: pass
- `grep -rn "—" src/components/dashboard src/app/dashboard`: no matches

## Evidence

- Freshness: `HEAD` is `c91d5b4`, `git merge-base main HEAD` is `76d4c36`, the spec SHA-256 matches, and the only working-tree change is `blueprint/context/review.md`.
- Delta reviewed in full: `src/app/dashboard/clients/[clientId]/page.tsx`, `src/components/dashboard/clients/ClientTable.tsx`, `tests/app/dashboard/clients/pages.test.tsx`, plus the spec and ledger text; callers and contracts followed into `src/server/queries/activity.ts`, `src/server/queries/clients.ts`, `src/lib/permissions.ts` and `src/db/index.ts`.
- Security: both parallel loaders run `ownedClient`, which rejects a malformed id via `idSchema` and scopes the lookup to `ownerId`; the activity `findMany` filters on `ownerId` and the owned client's id, so passing the raw route id adds no exposure.
- Performance: the detail view's critical path drops from three sequential round trips to two; two concurrent queries per view fit the pool's `max: 5`.
- Tests: the new concurrency test would fail against the old serial code; the activity-only `NotFoundError` and unexpected-error cases still give the scoped 404 and reach the error boundary.

## Findings

- F-34 [P3] closed (re-reviewed against the repaired page)
- F-35 [P3] closed (re-reviewed against the repaired table)
- No new findings. F-24, F-30 and F-33 are unaffected by this delta and unchanged.

## Remaining risk

- No browser or runtime pass was run (Check not required, and the dev server was off limits), so the "Not provided" cell and the detail page were verified by server-render tests only, not by axe or a live render.
- If one loader hits an unexpected database error while the other raises `NotFoundError` first, the page shows the 404 rather than the error boundary; only reachable on a partial database failure.
- No browser test command and no Verify command are configured for this project.
