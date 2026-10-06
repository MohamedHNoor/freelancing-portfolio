# Feature: Owner authentication

**From build-plan:** feature 16b
**Type:** Feature
**Status:** verified
**Branch:** `feature/owner-authentication`

## Goal

The owner, and only the owner, can authenticate against Neon's Managed Better
Auth through server-side code. There are four parts:

- a lazy, server-only auth instance
- the same-origin auth route handler
- an owner check that every later dashboard page, query and action can call
- the auth Server Actions that 16c's forms will submit to

Sign-up stays closed. Any account other than a verified `OWNER_EMAIL` is
treated as signed out. 16b ships no UI; 16c adds the screens and the dashboard
shell.

## In scope

- **Dependency:** install `@neondatabase/auth`, pinned exactly to `0.5.0-beta`.
  It is the planned dependency in architecture §2 and a pre-1.0 beta.
- **Auth env:** `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` and
  `OWNER_EMAIL`, validated lazily. Errors name the variable only, never the
  value. The names go into `.env.example` with comments and no values.
- **Auth instance:** a lazy `getAuth()` in `src/lib/auth/server.ts`
  (`server-only`). It wraps `createNeonAuth` with `sessionDataTtl: 60` and
  `logLevel: "silent"`.
- **Route handler:** `src/app/api/auth/[...path]/route.ts`. Its `GET`/`POST`
  delegate to `getAuth().handler()` inside the request, so importing the route
  never reads env.
- **Owner check:** a pure `isOwnerSession(session, ownerEmail)` in
  `src/lib/auth/owner.ts`. Session helpers in `src/server/auth/session.ts`:
  - `getOwner()`: React `cache()`, returns `{ userId }` or `null`
  - `requireOwner()`: for pages; redirects to `/login`
  - `requireOwnerForAction()`: returns an `UNAUTHENTICATED` result instead of
    redirecting
- **Auth Server Actions** in `src/actions/auth.ts`: `signIn`, `signOut`,
  `requestPasswordReset`, `resetPassword` and `resendVerification`. Each uses
  Zod validation from `src/lib/validation/auth.ts` and returns a shared
  `ActionResult<T>` from `src/types/action.ts`.
- **Public copy:** reword the three "every route is statically generated" claims
  (`src/content/projects.ts:253`, `:257`, `src/content/skills.ts:36`) to say
  every *public* route. This feature ships the first dynamic route.
- **Live configuration** of the Neon `development` branch, with a separate
  approval at implement time:
  - Managed Better Auth enabled
  - email/password on, email verification required, sign-up disabled
  - trusted domains
  - the auth email provider
  - the owner account

  The procedure is recorded in `blueprint/database-setup.md`.

## Out of scope

- **For 16c:** auth screens and forms, the dashboard shell and layouts, loading
  and error UI, browser verification of the owner flow, and the `/login` page
  that `requireOwner()` redirects to.
- **For feature 23:** the `production` branch's auth configuration, a production
  sender, and two-factor sign-in, which Managed Better Auth does not support.
- **For feature 17:** any Prisma model, migration or `neon_auth.user` reference.
- A sign-up action, register page or any self-service account creation.
- `proxy.ts` or `auth.middleware()` (architecture R3).

## Build loop

`workflow.stepReview` is `feature` and `checkpointCommits` is `disabled`. Build
and check each step in order, then present one feature-level review packet.
Steps 1-6 are offline. Step 7 is a live remote change and needs its own explicit
approval before any Neon call. Database and auth work is sensitive, so the
configured `independentReview: when-sensitive` gate applies before `/complete`.
`/complete` creates the feature commit.

## Build steps

- [x] **1. Dependency and auth env.**
  - Install `@neondatabase/auth@0.5.0-beta --save-exact`.
  - **SDK check before writing any auth code:** read the installed type
    definitions and confirm that `createNeonAuth` (from
    `@neondatabase/auth/next/server`) accepts `baseUrl`,
    `cookies.secret`/`sessionDataTtl` and `logLevel`. Also confirm the exact
    server method names for:
    - email sign-in
    - sign-out
    - getting the session
    - requesting a password reset
    - resetting the password
    - sending a verification email

    Record them in this spec. If one is missing, stop and revise the spec.
    **Confirmed in `0.5.0-beta` (2026-10-07):** `createNeonAuth(config)` takes
    `baseUrl`, `cookies: { secret, sessionDataTtl?, domain? }`, `logLevel` and
    `logger`, and throws when `secret` is shorter than 32 characters. It returns
    the server methods plus `handler()` (`GET/POST/PUT/DELETE/PATCH` taking
    `{ params: Promise<{ path: string[] }> }`) and `middleware()`. The methods
    are `signIn.email`, `signOut`, `getSession`, `requestPasswordReset`,
    `resetPassword` and `sendVerificationEmail`, matching the architecture
    sketch.
  - Add `src/lib/validation/auth-env.ts` and a lazy `getAuthEnv()` in
    `src/lib/env.ts`.
  - **Done when:** the env tests pass, covering valid, missing, malformed and
    redaction cases (see Data / contracts). Building with all three variables
    empty still passes.
- [x] **2. Auth instance and route handler.** Add `src/lib/auth/server.ts`
  (`getAuth()`, cached, built on first call from `getAuthEnv()`) and the route
  handler.
  - **Done when:** tests show that importing either module reads no env and
    calls no SDK, and that the first call builds exactly one instance with the
    documented options. `npm run build` lists `/api/auth/[...path]` as the only
    dynamic (`ƒ`) route and keeps all 19 public entries static. A build with
    empty auth variables passes.
- [x] **3. Owner check.**
  - `isOwnerSession` returns true only for a session with a user whose `email`
    (trimmed and lowercased) equals the trimmed, lowercased `OWNER_EMAIL`, and
    whose `emailVerified` is `true`.
  - `getOwner()` calls the SDK's get-session once per request and returns
    `{ userId: session.user.id }` only when that holds.
  - SDK errors and missing auth configuration propagate as unexpected errors.
    They are never treated as "signed out".
  - **Done when:** unit tests cover the owner case, another email, an unverified
    owner, mixed case and whitespace, a missing session or user, and an SDK
    failure. `requireOwner()` redirects to `/login`, and
    `requireOwnerForAction()` returns the `UNAUTHENTICATED` shape.
- [x] **4. `signIn` and `signOut` actions.**
  - `signIn` validates input, then calls the SDK. If the SDK reports success but
    the resulting session is not the owner's, it immediately signs that session
    out. It returns the same `INVALID_CREDENTIALS` result as a wrong password.
    An unverified owner gets `EMAIL_NOT_VERIFIED`.
  - `signOut` always clears the session and succeeds, even with no session.
  - **Done when:** tests with a mocked SDK cover invalid input (field errors), a
    wrong password, a non-owner account (signed out, generic error), an
    unverified owner, success, and an SDK throw (generic `UNEXPECTED`, with no
    provider text in the result or logs).
- [x] **5. Password reset and verification actions.**
  - `requestPasswordReset` and `resendVerification` always return the same
    success result for any well-formed email, whether or not an account exists.
    They call the SDK only for `OWNER_EMAIL`, so no request reveals or probes
    other accounts.
  - `resetPassword` validates the token and new password, then calls the SDK. An
    invalid or expired token returns `INVALID_TOKEN`.
  - Reset and verification links point at `${SITE_URL}/reset-password` and
    `${SITE_URL}/verify-email` (16c pages). The origin comes from
    `src/lib/site.ts`, never from the request.
  - **Done when:** tests cover enumeration-safe responses (owner, other email,
    malformed input), a bad token, success, and an SDK throw.
- [x] **6. Public copy and docs.**
  - Reword the three static-generation claims so they say every public route is
    statically generated, and the content tests still pass.
  - Add the auth variables to `.env.example`, and document the auth modules in
    `blueprint/database-setup.md`.
  - **Done when:** typecheck, lint, `npm test` and both builds (default, and
    with all database and auth variables empty) pass.
- [x] **7. Live `development` configuration (separate approval).** Only after
  the Open questions are answered and the user approves this named target, use
  the Neon MCP or CLI to:
  1. enable Managed Better Auth on the `development` branch
  2. set email/password on, email verification required and sign-up disabled
  3. add trusted domains (the Vercel preview origin; localhost is pre-approved)
  4. configure the agreed email provider
  5. create the owner account as agreed

  Keep secrets out of chat, the repo and logs. The owner puts
  `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` into `.env.local` and
  Vercel Preview themselves.
  - **Done when:** `get_neon_auth_config` (secrets redacted) shows sign-up
    disabled and verification required, and the owner user exists, verified.
    The procedure and target are recorded in `blueprint/database-setup.md`. An
    end-to-end sign-in through the UI is 16c's browser verification and is not
    claimed here.
  - **Result (2026-10-07):** `development` (`br-royal-darkness-a7qoz708`) in
    `mhnoor-portfolio` reads back as:
    - sign-up off
    - verification required, by link
    - custom SMTP `smtp.resend.com:465`, sender `auth@mohamedhnoor.com`
    - no OAuth providers
    - `allow_localhost: true`, trusted origin `https://www.mohamedhnoor.com`

    The owner `info@mohamedhnoor.com` exists and is the only user, but is **not
    yet email-verified and has no password** (admin-created). **Owner decision:**
    verification moves to 16c's browser verification, through the real flow
    (forgot password, set password, sign in, verification link), which also
    proves the Resend SMTP and link flows end to end.

## Files / areas

- **New:**
  - `src/lib/validation/auth-env.ts`
  - `src/lib/validation/auth.ts`
  - `src/lib/auth/server.ts`
  - `src/lib/auth/owner.ts`
  - `src/server/auth/session.ts`
  - `src/actions/auth.ts`
  - `src/types/action.ts`
  - `src/app/api/auth/[...path]/route.ts`
- **New tests**, mirroring `src/`:
  - `tests/lib/validation/auth-env.test.ts`
  - `tests/lib/validation/auth.test.ts`
  - `tests/lib/auth/server.test.ts`
  - `tests/lib/auth/owner.test.ts`
  - `tests/server/auth/session.test.ts`
  - `tests/actions/auth.test.ts`
  - `tests/app/api/auth/route.test.ts`
- **Changed:**
  - `src/lib/env.ts`
  - `tests/lib/env.test.ts`
  - `src/content/projects.ts`
  - `src/content/skills.ts`
  - `.env.example`
  - `package.json` and lockfile
  - `blueprint/database-setup.md`
- **Untouched:**
  - `src/lib/security-headers.ts`: the CSP already allows same-origin
    `connect-src` and `form-action`, and the auth proxy is same-origin.
  - `src/lib/robots.ts`: it already disallows `/api/`, `/login` and
    `/dashboard`.

## Data / contracts

**Env**, validated on first use in `getAuthEnv()`:

| Variable | Rule |
|---|---|
| `NEON_AUTH_BASE_URL` | An `https:` URL with a host, no credentials, no query and no fragment. The path is kept exactly (Neon's URL ends in `/neondb/auth`). |
| `NEON_AUTH_COOKIE_SECRET` | A string of at least 32 characters. |
| `OWNER_EMAIL` | A valid email address, trimmed and lowercased. |

Errors use the existing `DatabaseConfigurationError` style: a dedicated
`AuthConfigurationError` that names only the variable, with no `cause` and no
value. There is no fallback between variables.

**`ActionResult<T>`** (`src/types/action.ts`):

```ts
| { success: true; data: T; error: null }
| { success: false; data: null; error: { code: ActionErrorCode; message: string; fieldErrors?: Record<string, string[]> } }
```

The `ActionErrorCode` values used here are `VALIDATION`, `INVALID_CREDENTIALS`,
`EMAIL_NOT_VERIFIED`, `INVALID_TOKEN`, `UNAUTHENTICATED` and `UNEXPECTED`.
Messages are fixed, friendly copy. Provider text never reaches a result.
`src/actions/contact.ts` keeps its own `ContactResult` and is not migrated here.

**Action inputs** (Zod 3, `z.input`/`z.output` exported for 16c):

| Action | Input |
|---|---|
| `signIn` | `{ email: string (email, trimmed, lowercased, ≤254), password: string (1-128) }` |
| `requestPasswordReset`, `resendVerification` | `{ email }`, same rule |
| `resetPassword` | `{ token: string (1-512), password: string (12-128) }` |
| `signOut` | no input |

The 12-character minimum is the app's own rule. Neon may enforce a stricter one,
which surfaces as `VALIDATION`.

**Action outputs:**

| Action | Success `data` |
|---|---|
| `signIn` | `{ redirectTo: "/dashboard" }` |
| `signOut` | `{ signedOut: true }` |
| `requestPasswordReset`, `resendVerification` | `{ sent: true }`, always, for any well-formed email |
| `resetPassword` | `{ reset: true }` |

The actions never redirect themselves; 16c's forms navigate on success.

**Owner rule:** `email.trim().toLowerCase() === OWNER_EMAIL` and
`emailVerified === true`. The user id comes only from the server-side session,
never from input.

**Logging:** server logs carry an action name and an error code only. They
never include an email address, password, token, session, cookie, URL with a
token, or provider message.

## Testing

`npm test` (Vitest) covers every logic module above. The SDK is mocked at
`@neondatabase/auth/next/server`, and `next/headers`/`next/navigation` are
mocked where used, as `tests/actions/contact.test.ts` does. No test contacts
Neon. Build evidence comes from `npm run build` and the empty-variables build.

Nothing in 16b is browser-verifiable. Live evidence is limited to step 7's
config read-back. There is no `Browser tests` or `Verify` command, so the
fallback gate is typecheck, lint, tests and build.

## Notes for the AI

- Every module that reads auth env or touches the SDK starts with
  `import "server-only"`. None throws at import, because the static build
  imports routes.
- The SDK caches session data in a signed cookie for `sessionDataTtl`. Do not
  claim immediate revocation.
- Keep `logLevel: "silent"`. App-side logging uses codes only, which resolves
  architecture risk F-22 without needing to inspect SDK log content live.
- Do not run any live Neon command before step 7's approval, and never print
  connection strings, the Auth URL secret or the cookie secret.
- If the installed SDK's method names differ from the architecture sketch
  (`auth.signIn.email()` and friends), follow the installed types and note the
  difference in `dashboard-architecture.md` §5.

## Open questions

These block **step 7 only**. Steps 1-6 do not depend on them.

1. **Neon project.** Is there an existing Neon project (PostgreSQL 17,
   `aws-ap-southeast-2`) with a `development` branch to configure, or should
   step 7 create one? Creating a project is a separate decision.
2. **Owner account creation.** Recommended: keep sign-up disabled from the
   start and create the owner once through the Neon Console or MCP
   `create_auth_user`, then confirm `emailVerified`. The alternative is a brief
   sign-up window closed immediately afterwards.
3. **Auth email on `development`.** Neon's shared sender delivers codes only,
   while reset and verification *links* need custom SMTP. Is the Resend domain
   `mohamedhnoor.com` verified? If not, step 7 can use Resend's SMTP relay with
   its test sender, which only delivers to the Resend account owner's address.
   That works only if that address is `OWNER_EMAIL`.

## Findings

No finding was resolved in this work item. The review raised F-25 to F-28 (P2/P3, open or unverified); they stay in the live ledger for a later pass.

## Independent review

**Status:** passed
**Target commit:** 255d3c0cf34cd480fc7e40c8aecda961fae07f7c
**Base commit:** 1642672e4d24451106d205c8cf4bf2c8838a8054
**Base ref:** origin/main
**Spec hash:** 87a67f10c95f285a81983c9044f6e89615def918389bd8a2f64f4f268d6a275e
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-06T22:23:01Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-06T22:26:07Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Commands

- `git rev-parse HEAD`, `git merge-base origin/main HEAD`, `shasum -a 256 blueprint/context/current-feature.md`, `git status --porcelain --untracked-files=all`: pass (HEAD, merge base and spec hash match the request; only `blueprint/context/review.md` differed)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm test`: pass (28 files, 504 tests)
- `npm run build`: pass (`/api/auth/[...path]` is the only `ƒ` route; 19 static pages generated)
- `NEON_AUTH_BASE_URL= NEON_AUTH_COOKIE_SECRET= OWNER_EMAIL= DATABASE_URL= DATABASE_URL_UNPOOLED= TEST_DATABASE_URL= npm run build`: pass (same route table)

### Evidence

- Reviewed the full `1642672..255d3c0` delta: `src/actions/auth.ts`, `src/app/api/auth/[...path]/route.ts`, `src/lib/auth/{owner,server}.ts`, `src/lib/validation/{auth,auth-env}.ts`, `src/lib/env.ts`, `src/server/auth/session.ts`, `src/types/action.ts`, the public copy changes, `.env.example`, `package.json`, `blueprint/database-setup.md`, and the eight test files.
- Owner rule (`src/lib/auth/owner.ts:15-27`) requires a non-empty string id, a string email that matches the normalized `OWNER_EMAIL` after trim and lowercase, and `emailVerified === true`. `getOwner()` derives the user id only from the server session, and SDK errors throw `AuthServiceError` instead of reading as signed out.
- Enumeration: reset and verification actions return the same `{ sent: true }` for any well-formed email and call the SDK only for the owner. Sign-in tells only the owner's address about verification. The proxy path is a separate surface (F-27).
- Redaction: `AuthConfigurationError` names only the variable. Action logs carry the action name plus a provider code or `Error.name`. The SDK runs with `logLevel: "silent"`. A scan of the delta found no committed secret; the Auth URL in `database-setup.md` is a public endpoint.
- Lazy env and build safety: `getAuth()` and the route's handlers are built on first call. Both builds pass with all auth and database variables empty.
- Installed SDK `@neondatabase/auth@0.5.0-beta` read offline to confirm cookie, sign-out and proxy behavior behind F-25 to F-28.
- Tests lens: no skipped, focused or placeholder tests in the new files. The SDK is mocked at `getAuth()`, so the tests cannot observe cookie behavior (F-25).

### Findings

- F-25 [P2] open: the non-owner sign-out after sign-in cannot reach the new session, because the SDK reads cookies from the request headers
- F-26 [P2] open: any 403 from sign-in is shown to the owner as `EMAIL_NOT_VERIFIED`, with nothing logged
- F-27 [P2] unverified: the auth proxy exposes the whole upstream Better Auth API beside the guarded actions, and there is no app-level rate limit
- F-28 [P3] unverified: `requireOwner()` in a Server Component may throw when the SDK writes refreshed cookies
- F-24 [P3] fixed (pre-existing; its files are not in this delta, so it is neither re-examined nor closed)

### Remaining risk

- Check was not required and was not run. No browser or end-to-end sign-in evidence exists; it belongs to 16c.
- No live Neon or Resend call was made, by instruction. Upstream behavior (sign-up refusal, enumeration-safe answers, rate limits, origin checks, `get-session` Set-Cookie) is unverified (F-27, F-28).
- No `Browser tests` or `Verify` command is configured. No dependency vulnerability scan was run; `@neondatabase/auth` is a pre-1.0 beta.
- Session revocation is not immediate: the signed session-data cookie is trusted for up to 60 seconds.
