# Fix: Owner action auth failure and test database guard

**Type:** Fix

**Status:** verified

**Branch:** fix/owner-action-auth-failure-and-test-database-guard

**Fixes:** F-31, F-32

## The problem

1. **F-31.** In [owner-action.ts](../../src/server/owner-action.ts),
   `ownerAction` awaits `requireOwnerForAction()` before its `try` block. When the
   Neon Auth session lookup fails, `getOwner()` throws `AuthServiceError`. When
   auth configuration is missing, `getAuthEnv()` throws. In both cases
   `createClient`, `updateClient` and `archiveClient` reject instead of returning
   an `ActionResult`. 17b's forms would then land on an error boundary instead
   of showing a friendly message. This breaks 17a's contract that anything else
   maps to `UNEXPECTED`, and it breaks the try/catch standard for Server
   Actions. No test covers a failing session lookup.
2. **F-32.** `testDatabaseUrl()` in
   [database.ts](../../tests/integration/support/database.ts) checks only
   `new URL(url).hostname`. But `pg` lets a query parameter such as `?host=`,
   `?hostaddr=` or `?port=` override the URL's host. So
   `postgresql://localhost:5432/portfolio_test?host=db.remote.example` passes the
   guard, and global setup then drops that remote database's schemas. The guard
   has no automated test.

## The fix

- **F-31:** run the owner check inside error handling. If
  `requireOwnerForAction()` throws, log `[<scope>] <action> failed: <code>`,
  using the same code-only rule as other unexpected errors, and return
  `UNEXPECTED`. A signed-out or non-owner session must still return
  `UNAUTHENTICATED` before any input is read. The order stays the same: owner
  check, id check, input validation, then the handler.
- **F-32:**
  - Extract the URL check into a pure exported function,
    `assertSafeTestDatabaseUrl(url)`. `testDatabaseUrl()` keeps loading env and
    calls it.
  - The function refuses any URL with a query string. A local test database
    needs none, and every `pg` override travels in the query string.
  - It keeps the existing rules: the host is `localhost`, `127.0.0.1` or `::1`,
    and the database name starts with `portfolio` and ends in `_test`.
  - The error message still names only the variable.
- **Must not break:**
  - Every existing action result and log line.
  - The `UNAUTHENTICATED` constant's shape.
  - Your `.env.test.local` URL, which has no query string.
  - `npm test` stays database-free.

## Build steps

- [x] **1. Owner check errors map to `UNEXPECTED`**
  - Change `src/server/owner-action.ts`.
  - In `tests/actions/clients.test.ts`, add one case where the session lookup
    rejects with an `AuthServiceError`-like error and one where it rejects with
    a configuration error. Each must return `UNEXPECTED` with the generic
    message, log only `[clients] <action> failed: <ErrorName>`, and call no
    service or `revalidatePath`.
  - **Done when:** `npx vitest run tests/actions` passes with the new cases.

- [x] **2. The test database guard refuses query strings**
  - Add `assertSafeTestDatabaseUrl` to `tests/integration/support/database.ts`.
  - Add a unit test at `tests/support/integration-database.test.ts`, in the
    default suite, so it runs without a database. It accepts
    `postgresql://localhost:5432/portfolio_test` and `127.0.0.1` and `[::1]`
    variants. It refuses:
    - a remote host
    - `?host=db.remote.example`
    - `?hostaddr=10.0.0.1`
    - `?port=6543`
    - `?sslmode=require`
    - `my_website_test`
    - `portfolio`
    - `portfolio_dev`
  - Every refusal message must not contain the URL.
  - **Done when:** `npm test` passes, including the new file, and
    `TEST_DATABASE_URL='postgresql://localhost:5432/portfolio_test?host=db.remote.example' npm run test:integration`
    exits non-zero without connecting.

- [x] **3. Final gate**
  - **Done when:** `npx tsc --noEmit`, `npm run lint`, `npm test`,
    `npm run test:integration` and `npm run build` all pass. Mark F-31 and F-32
    `fixed` in `blueprint/context/findings.md` with their resolution notes.

## Verify

- `npx vitest run tests/actions/clients.test.ts`: the session-failure cases
  return `UNEXPECTED`.
- `npx vitest run tests/support/integration-database.test.ts`: every unsafe URL
  is refused.
- `npm run test:integration` still passes against `portfolio_test`.
- With `?host=db.remote.example` appended, `npm run test:integration` fails
  immediately with the guard message.

## Findings

### owner-action-auth-failure-and-test-database-guard/F-31 [P2] closed - An auth-service failure escapes the owner action pipeline as a thrown error instead of `UNEXPECTED`

**File:** src/server/owner-action.ts:54
**Found:** 2026-10-09 by /audit (independent; scope: current; lens: quality, security, performance, tests)
**Why it matters:** `ownerAction` awaits `requireOwnerForAction()` before its `try` block (`owner-action.ts:54`, try at `:69`). `getOwner()` throws `AuthServiceError` when Neon Auth's `get-session` returns an error, and `getAuthEnv()` throws on missing configuration (`src/server/auth/session.ts:24-26`). Either way `createClient`, `updateClient` and `archiveClient` reject instead of returning the `{ success, data, error }` result, so 17b's forms would hit an error boundary rather than the friendly message. This breaks the spec's action contract ("Anything else maps to `UNEXPECTED`") and the standard that Server Actions use try/catch; the auth actions in `src/actions/auth.ts` wrap every provider call. No data or security impact: no write happens and Next redacts thrown messages in production. `tests/actions/clients.test.ts` mocks `requireOwnerForAction` and never covers a throwing session lookup.
**Suggested fix:** Move the owner check inside the existing try/catch (or wrap it in its own), mapping a thrown error to `UNEXPECTED` with the same code-only log line, and add an action test where the session lookup rejects.
**Resolution:** Fixed on `fix/owner-action-auth-failure-and-test-database-guard` (2026-10-09): `ownerAction` runs `requireOwnerForAction()` inside try/catch, so a thrown session lookup or configuration error logs `[<scope>] <action> failed: <ErrorName>` and returns `UNEXPECTED`; `UNAUTHENTICATED` is unchanged. `tests/actions/clients.test.ts` covers both failures for all three actions. Awaiting `/audit` re-review.

**Re-reviewed 2026-10-09 by /audit (independent; scope: current; lens: quality, security, performance, tests; f706b00..b5e8e04): closed.** `src/server/owner-action.ts:60-68` now awaits `requireOwnerForAction()` inside try/catch; a throw goes through the shared `logFailure` (code-only log, `UNEXPECTED`), while the resolved `UNAUTHENTICATED` result is still returned before the id or input is read, so pipeline order is unchanged. `requireOwnerForAction` is its only caller and all three client actions use `ownerAction`. The new `tests/actions/clients.test.ts` cases reject the session lookup with an `AuthServiceError`-named and a configuration error and assert the exact result, the exact log lines, and that no service or `revalidatePath` runs; `tests/server/auth/session.test.ts` already proves `getOwner()` rejects on upstream and configuration failure. `npm test` passes (666 tests). The repair introduced no new defect.

### owner-action-auth-failure-and-test-database-guard/F-32 [P2] closed - The integration database guard checks the URL hostname, but a `host` query parameter redirects the connection

**File:** tests/integration/support/database.ts:31
**Found:** 2026-10-09 by /audit (independent; scope: current; lens: quality, security, performance, tests)
**Why it matters:** `testDatabaseUrl()` refuses non-local URLs by checking `new URL(url).hostname`, but `pg` (`pg-connection-string`) copies query parameters into the config and lets `?host=` (and `?port=`) override the URL's host. Confirmed offline without connecting: `postgresql://localhost:5432/portfolio_test?host=db.remote.example` passes the guard while `pg` resolves its host to `db.remote.example`. Global setup then runs `DROP SCHEMA public CASCADE` against that host. Exploiting it needs a remote database whose name matches `portfolio*_test`, so the practical risk is low, but the guard exists solely to prevent this data loss and the step 4 done-when requires a non-local host to be refused before connecting. The guard has no automated test.
**Suggested fix:** Also refuse any URL whose search params contain `host`, `hostaddr` or `port` (or simply any query string other than an allow-listed `sslmode`), or validate the result of `pg-connection-string`'s `parse()` instead of the WHATWG hostname. Add a unit test for `testDatabaseUrl` covering a remote host, a `?host=` override and a name without `_test`.
**Resolution:** Fixed on `fix/owner-action-auth-failure-and-test-database-guard` (2026-10-09): the check is now `assertSafeTestDatabaseUrl()`, which also refuses any query string, so `host`, `hostaddr` and `port` overrides cannot redirect the connection. `tests/support/integration-database.test.ts` covers accepted local URLs and every refused case in the default suite; a `?host=` URL makes `npm run test:integration` exit before connecting. Awaiting `/audit` re-review.

**Re-reviewed 2026-10-09 by /audit (independent; scope: current; lens: quality, security, performance, tests; f706b00..b5e8e04): closed.** `assertSafeTestDatabaseUrl()` (`tests/integration/support/database.ts:28-35`) refuses any non-empty `search`, and both the global setup and the worker setup still reach it through `testDatabaseUrl()` before connecting. Probed offline against `pg-connection-string` 2.14.1's `parse()`: every URL the guard accepts (including a bare trailing `?`, percent-encoded names and passwords, and `#?host=`) resolves to host `localhost`, while `?host=`, `%3Fhost=` in the name and comma host lists are refused. `TEST_DATABASE_URL='postgresql://localhost:5432/portfolio_test?host=db.remote.example' npm run test:integration` exits 1 in global setup with `UnsafeTestDatabaseError` and the output never contains the remote host; the normal `npm run test:integration` passes (15 tests). `tests/support/integration-database.test.ts` runs in the default suite with no database. The repair introduced no new defect.

## Independent review

**Status:** passed
**Target commit:** b5e8e043fd3476ef27279b7cee29f4b5f72a497a
**Base commit:** f706b0089fdb10c7b9a61323a3eaf00d814e2447
**Base ref:** main
**Spec hash:** 68b56ed2ff1a007e5c581e519599770024e268e6a0479bb6d4c19048ad4e07eb
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-08T13:53:16Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-08T13:55:39Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `f706b0089fdb10c7b9a61323a3eaf00d814e2447..b5e8e043fd3476ef27279b7cee29f4b5f72a497a` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm test`: pass (39 files, 666 tests)
- `npm run test:integration`: pass (3 files, 15 tests, local `portfolio_test`)
- `TEST_DATABASE_URL='postgresql://localhost:5432/portfolio_test?host=db.remote.example' npm run test:integration`: exits 1 in global setup with `UnsafeTestDatabaseError` before connecting (expected refusal)
- `npx prisma validate`: pass
- `npm run build`: pass
- Offline probe of `pg-connection-string` 2.14.1 `parse()` against the guard (scratchpad script, no connection): pass

## Evidence

- Freshness: `HEAD` equals the target, `git merge-base main HEAD` equals the base commit, the spec SHA-256 matches, and only `blueprint/context/review.md` differed from the target before this receipt.
- `src/server/owner-action.ts:60-68`: the owner check runs inside try/catch; a throw maps to `UNEXPECTED` with the code-only log via the shared `logFailure`; the `UNAUTHENTICATED` result still returns before id and input parsing.
- `tests/actions/clients.test.ts`: new cases assert the exact result, exact log lines, and no service or `revalidatePath` call for both session-lookup failures across all three actions.
- `tests/integration/support/database.ts:28-35`: `assertSafeTestDatabaseUrl()` refuses any query string; global setup and worker setup both reach it through `testDatabaseUrl()` before connecting. Every URL the guard accepts resolves to host `localhost` under `pg`'s own parser.
- The refused-override run's output never contains the remote host; `tests/support/integration-database.test.ts` runs in the database-free default suite.
- Docs in `AGENTS.md` and `blueprint/database-setup.md` match the new guard behavior.

## Findings

- F-31 [P2] closed (re-reviewed against the repaired code)
- F-32 [P2] closed (re-reviewed against the repaired code)
- No new findings

## Remaining risk

- No browser test command is configured; no UI surface changed in this delta, and Check was not required.
- The `AuthServiceError` case in `tests/actions/clients.test.ts` uses a name-shaped `Error` because the session module is mocked; the real class's propagation is covered separately in `tests/server/auth/session.test.ts`.
- The guard does not pin the port: an empty URL port lets `pg` fall back to `PGPORT`, so a different local server could be targeted. The host stays local and the name rule still applies, so no remote data is at risk.
- F-24 (P3, fixed), F-30 (P3, open) and F-33 (P3, unverified) were outside this delta and remain as recorded; none blocks `/complete`.
