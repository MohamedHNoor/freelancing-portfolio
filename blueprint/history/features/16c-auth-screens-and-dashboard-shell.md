# Feature: Auth screens and dashboard shell

**From build-plan:** feature 16c
**Status:** verified
**Branch:** feature/auth-screens-and-dashboard-shell

## Goal

Give the owner a complete sign-in and account-recovery path into a protected,
responsive business dashboard shell. Use the Managed Neon Better Auth integration
shipped in 16b and the approved visual direction. This feature establishes the
workspace; later features populate it with clients, projects and payments.

## Design reference

- `prototypes/overview.html` supplies the workspace shell, hierarchy, navigation,
  density and mobile direction. Its business records and metrics are fixtures,
  not data to copy into this feature.
- `prototypes/theme.css` and `prototypes/components.css` supply the approved
  shared tokens and component treatment. Port the tokens needed by these screens
  before building their UI; retain the existing light/dark violet palette and
  Inter/Space Grotesk typography.
- Use the existing shadcn button, input, label, card and Sheet primitives, the
  contact form's accessible validation pattern, ThemeToggle and SkipLink.
- Keep the prototype files: the project, payment, creation and client screens
  remain references for later work. Auth cards derive from the same design system.

## In scope

- Centered auth layout and `/login`, `/forgot-password`, `/reset-password` and
  `/verify-email` screens with appropriate titles and noindex/nofollow metadata.
- Accessible forms wired to the existing sign-in, password-reset request,
  password-reset and verification-resend server actions.
- First-password setup and verification recovery for the existing owner account.
- Owner-protected `/dashboard` layout and initial overview page, responsive
  navigation, theme switching, sign-out and honest empty/loading/error states.
- Tests for new UI-supporting logic, existing auth regression checks, browser
  evidence and verification that public routes retain their static behavior.
- Repair the confirmed live-login prerequisite: recognize the installed Neon
  SDK's normalized auth error codes in the existing actions and disable Next's
  development logging of credential-bearing Server Action arguments.

## Out of scope

- Client/project/milestone/task CRUD, payment requests, Stripe, business metrics,
  resource detail pages, settings, a client portal or fabricated dashboard data.
- Registration, social login, additional users, profile management, session
  management UI, MFA, a client-side auth provider or a `returnTo` redirect feature.
- Replacing the existing Managed Neon SDK/actions, changing Prisma models or
  migrations, creating auth tables, or adding database access to this UI.
- Changing Neon Auth settings, SMTP, trusted origins, live data or secrets; adding
  a test runner, browser harness, CI workflow or unnecessary dependencies.
  Exception approved on 2026-10-07: correct only the development Auth sender to
  `auth@contact.mohamedhnoor.com` and add an ignored `.env.local` override of
  `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local recovery verification.
- Commits, merges, pushes or deployment as part of this planning command.

## Build loop

Follow `workflow.stepReview: feature`: implement the small steps sequentially,
verify each changed behavior, then present one feature review packet. Checkpoint
commits are disabled. Keep code strictly typed, use no `any`, and create no
Tailwind configuration file. Reuse existing context and primitives.

## Build steps

### 1. Establish shared visual and form contracts

- [x] Port only the approved tokens needed for the auth cards and dashboard
  shell into `src/app/globals.css`, with light/dark values and Tailwind v4 aliases
  where needed. Preserve the public site's base palette, fonts and existing
  tokens; do not port fixture-specific payment/progress styling unnecessarily.
- [x] Reuse `src/lib/validation/auth.ts`, its inferred input types and
  `ActionResult`. Add small typed helpers/types only where the screens need new
  logic, such as parsing a single reset token or applying known field errors.
- [x] Define shared field/feedback components where they remove duplication.
  Preserve passwords exactly, constrain error mapping to known form fields, and
  provide field errors, form-level feedback and focus behavior.
- [x] Add Vitest coverage in the matching `tests/` paths for any new parser,
  validator or result-handling logic. Reuse existing auth tests for contracts
  already covered rather than adding tests that mirror markup.

**Done when:** both themes expose the required shared tokens; new logic has
passing boundary/failure tests; validation uses the existing email/password
rules; malformed or repeated reset-token parameters cannot reach the reset
mutation; no dependency or Tailwind config has been added.

### 2. Build login and password-reset request screens

- [x] Add the auth layout with a clearly labelled main landmark, skip link,
  shared branding/card treatment and theme control. Set auth titles and
  noindex/nofollow metadata; apply a no-referrer policy to these pages using the
  existing configuration/Metadata mechanism without weakening security headers.
- [x] Build login using existing React Hook Form, Zod and `signIn`. Show pending,
  invalid input, invalid credentials, owner email-not-verified and unexpected
  failure states. Include forgot-password and verification recovery paths.
- [x] On successful login, navigate to the action's fixed `/dashboard` destination
  and refresh the router so protected server content observes the new session.
  An already authorized owner may be redirected from login to `/dashboard`.
- [x] Build forgot-password using `requestPasswordReset`. For every well-formed
  email, show the same conditional notice: if the address is eligible, the user
  can check for a link. Do not claim delivery or reveal whether an account exists.
- [x] Disable duplicate submissions while pending, retain useful field values
  on failure, associate errors with fields, focus the first invalid field or
  form error as appropriate, and announce asynchronous outcomes.

**Done when:** login validates passwords at 1–128 characters without trimming;
all expected action errors have usable recovery; successful owner login reaches
`/dashboard`; forgot-password responses remain indistinguishable for eligible
and other addresses; forms work by keyboard and narrow screens; no sign-up or
arbitrary redirect destination is exposed.

### 3. Complete password reset and email-verification recovery

- [x] Add reset-password with the existing `{ token, password }` contract. Accept
  one nonempty token of at most 512 characters from the supported callback shape;
  reject missing, repeated or oversized values before submission. Treat the token
  as opaque and never display it as feedback.
- [x] Require a new password of 12–128 characters, preserving whitespace. Do not
  introduce confirmation-password or redirect fields into the server contract.
- [x] Provide safe invalid/expired-link and unexpected-failure states, with a
  route to request a fresh link. After reset success, replace the token-bearing
  URL with `/login`, refresh and provide a clear path to sign in.
- [x] Add verify-email with clear next steps, a verification-resend form wired to
  `resendVerification`, the same conditional email-request notice, and a login
  link. Keep it reachable during recovery even if a session exists.
- [x] Confirm the installed SDK's actual reset/verification callback parameters
  before interpreting them. Managed Neon performs verification; this screen
  must not invent a verification mutation. Display only fixed, supported status
  messages. Missing or unknown callback status must not claim verification.

**Done when:** valid reset links submit the unchanged token and validated new
password; missing/invalid/expired links have an accessible recovery state; reset
success removes the token URL; verification requests preserve non-enumeration;
query text is neither echoed nor trusted as identity; the existing owner's first
password and email-verification flow can proceed without enabling registration.

### 4. Build the protected dashboard shell and error boundaries

- [x] Add `src/app/dashboard/layout.tsx` and `page.tsx`; call `requireOwner()` in
  both. Set private metadata and the dashboard title template. Do not move auth,
  session or database work into the public root or marketing layout.
- [x] Build reusable shell components under `src/components/dashboard/shell/`:
  sidebar, topbar and mobile Sheet navigation. Reuse theme control and provide
  correctly labelled controls, current-page indication, focus return and an
  accessible main-content target.
- [x] Make Overview the only active dashboard destination. Show future Clients,
  Projects, Payments and Settings destinations clearly as unavailable, without
  fake links, fake routes, counts or records. The initial overview should explain
  the workspace and show a useful empty state, without invented KPIs or creation
  buttons for features that do not exist yet.
- [x] Wire sign-out through the existing action, with pending/error feedback.
  On success, replace navigation with `/login` and refresh. Verify the protected
  route is denied afterward; an action result alone is not proof of session
  removal.
- [x] Add appropriate dashboard loading and content-error states. Add a parent
  boundary, such as `src/app/error.tsx`, for unexpected failures thrown by the
  dashboard layout guard: `dashboard/error.tsx` cannot catch its own layout.
  Reuse a simple error component if helpful; never expose provider errors or
  private details. Offer a meaningful retry path and preserve main/skip-link
  accessibility when the parent fallback replaces the shell.

**Done when:** signed-out, unverified and non-owner sessions cannot render
protected content; verified owner sessions can use the shell; provider lookup
failures reach an unexpected-error fallback rather than masquerading as signed
out; sign-out followed by navigation/refresh denies dashboard access; mobile
navigation, keyboard focus, themes, loading and empty states work; the public
site renders normally through its existing layouts.

### 5. Verify behavior and present the feature for review

- [x] Run `npx tsc --noEmit`, `npm run lint`, `npm test` and `npm run build`.
  Fix introduced failures, review the final diff, and report exact results.
  No Verify or Browser tests command currently exists; do not invent one here.
- [x] Use the available browser tools and a user-started local server to verify
  desktop/mobile, both themes, keyboard/focus, reduced motion, form pending/error
  states, navigation, initial empty dashboard and absence of console errors.
- [x] Verify against the intended development Neon Auth branch and reachable
  callback origin. Ask the owner to enter passwords and use emailed links
  privately for first-password setup, verification, login and sign-out. Capture
  observable results with token/query/body values redacted. Apart from the two
  expressly approved development corrections above, do not change provider
  configuration, expose secrets or send messages to others to satisfy this gate.
- [x] Prove invalid/expired reset recovery, uniform request notices, protected
  access denial and unexpected auth failure handling through the appropriate
  existing tests/browser evidence. Distinguish mocked contracts from live SDK,
  email and cookie evidence; do not mark unavailable live evidence passed.
- [x] Check the build's public routes remain static/SSG, auth/dashboard routes
  remain private, and private routes are absent from sitemap output. Recheck the
  existing public-route budgets affected by global styles using the available
  browser measurements. Review static-site wording and change only any remaining
  claims that incorrectly describe private routes as static.
- [x] Present the configured independent-review handoff after passing checks and
  final diff review. This feature is sensitive because it handles credentials
  and protected routes. Follow the existing automatic/fresh-reviewer checkpoint
  policy; do not create commits or waive findings without authorization.

**Done when:** automated checks pass; browser evidence covers the specified
screens and meaningful auth states; live owner bootstrap/session results and
any limitations are explicitly recorded; public rendering/budgets are preserved;
no secrets appear in artifacts; the final diff is reviewable and the configured
independent-review gate is satisfied before completion.

### 6. Repair independent-review findings (F-25, F-27, F-28, F-29)

- [x] F-28: page renders read the session through a cookie-safe reader
  (`getSessionReader()` in `src/lib/auth/server.ts`, the SDK's exported
  `createAuthServer` with a request context that drops cookie writes), so a
  session-cache miss after 60 seconds cannot throw from a forbidden render-time
  cookie write. Actions and the route handler keep the writable Next adapter.
- [x] F-25: a non-owner sign-in also expires every Neon Auth cookie directly
  (Secure, so `__Secure-` cookies are replaced) and logs a failed provider
  sign-out by code only. Upstream revocation remains best-effort and documented.
- [x] F-27: `/api/auth/[...path]` forwards only `GET get-session` and
  `POST sign-out`; every other path is 404 without touching the SDK. Reset and
  verification requests are limited to 3 per visitor and action per 15 minutes
  with the contact form's per-instance limiter (`clientKey` moved to
  `src/lib/rate-limit.ts`); over the limit, the same `{ sent: true }` answer is
  returned with nothing sent, for owner and non-owner addresses alike.
- [x] F-29: the reset button reads "Save new password"; success replaces the
  token URL with `/login?reset=done`, and the login page shows one fixed
  "Password saved" notice only for that exact value.

**Done when:** each repair has focused Vitest coverage (including a real-SDK
test that reproduces the render-time cookie throw through the default adapter
and proves the reader avoids it), `npx tsc --noEmit`, `npm run lint`, `npm test`
and `npm run build` pass, and a fresh independent review re-examines the delta.

## Files / areas

Expected additions:

- `src/app/(auth)/layout.tsx` and the login, forgot-password, reset-password and
  verify-email `page.tsx` files beneath that group.
- `src/app/dashboard/layout.tsx`, `page.tsx`, `loading.tsx`, and content error
  handling where reachable; `src/app/error.tsx` for nested-layout failures.
- `src/components/auth/` for the forms and shared accessible field/feedback UI.
- `src/components/dashboard/shell/` for sidebar, topbar and mobile navigation.
- Small supporting types/helpers and corresponding `tests/` files only when
  new logic needs them; types belong in `src/types/auth.ts` if required.

Expected changes/reuse:

- `src/app/globals.css` for shared design tokens.
- Existing `src/actions/auth.ts`, `src/lib/validation/auth.ts`,
  `src/types/action.ts`, `src/server/auth/session.ts`, auth API handler,
  ThemeToggle, SkipLink and UI primitives: reuse their contracts, avoid rewriting.
- Existing auth/action/session tests for regressions. Metadata or the existing
  security configuration may need a narrowly scoped auth referrer-policy update.
- `src/actions/auth.ts` and its existing tests for the confirmed SDK error-code
  mismatch found during owner-led login verification. `next.config.ts` also
  disables development Server Function argument logging.
- `src/content/projects.ts` only if verification finds an inaccurate blanket
  static-rendering claim; it already describes public-route static generation.
- This spec and normal implementation evidence updates. Preserve prototypes and
  defer plan/history/completion bookkeeping to the corresponding workflow.

No planned changes to Prisma schema/migrations, database access, package
versions, `.env`, public marketing layouts or the Managed Auth API route.
The approved local callback override lives only in ignored `.env.local`.

## Data / contracts

- `signIn(raw)` returns `ActionResult<{ redirectTo: "/dashboard" }>`.
  `signOut()` returns `ActionResult<{ signedOut: true }>`.
  `requestPasswordReset(raw)` and `resendVerification(raw)` return
  `ActionResult<{ sent: true }>`; `resetPassword(raw)` returns
  `ActionResult<{ reset: true }>`. These actions do not navigate.
- Reuse the union's `success` discriminant. Expected errors are `VALIDATION`,
  `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `INVALID_TOKEN`,
  `UNAUTHENTICATED` and `UNEXPECTED`; display safe existing messages and known
  field errors, never raw provider exceptions or arbitrary callback text.
- Emails are trimmed/lowercased, validated and limited to 254 characters.
  Login password length is 1–128; reset password length is 12–128. Passwords and
  reset tokens are not normalized. A reset token is a single 1–512-character
  string. No `returnTo` or confirmation-password server field exists.
- Email-request actions return identical success for valid emails even on
  provider failures; only the configured owner is eligible for a provider call.
  `/reset-password` and `/verify-email` callbacks use configured `SITE_URL`.
  Reset success navigates to `/login?reset=done`; only that exact value maps
  to a fixed notice. `/api/auth/[...path]` forwards only `GET get-session` and
  `POST sign-out`. Email requests are limited to 3 per visitor and action per
  15 minutes, answering identically when limited.
- Authorization requires a nonempty user ID, normalized email matching
  `OWNER_EMAIL`, and `emailVerified === true`. Reuse `requireOwner()` on each
  protected page and layout. Ordinary unauthorized sessions redirect to `/login`;
  SDK/configuration/session lookup failures propagate as unexpected errors.
- The SDK uses a 60-second signed-cookie session cache. Do not promise immediate
  provider-side revocation behavior beyond the observed sign-out flow or add a
  second session cache. The existing sign-out action ignores returned provider
  errors, so verify cookie/protected-route behavior rather than inferring it from
  `{ signedOut: true }`; record any observed prerequisite failure before completion.
- Auth-service logging remains code/name only. Never log or include passwords,
  tokens, email addresses, cookies or callback URLs with secrets in evidence.
  Keep callback pages free of new third-party resources and apply no-referrer.
- Public root/marketing rendering must stay independent of auth configuration,
  session lookups and database access. Never swallow auth outages as a null owner.

## Testing

- Vitest: new token/form-supporting logic boundaries where introduced, existing
  validation/action/owner/session suites, failure result handling and session-error
  propagation. Tests requiring DOM or a browser use the available browser tools;
  do not add a new DOM/testing dependency just for these forms.
- Browser: login field errors and server feedback focus, duplicate-submit
  prevention, conditional request notices, reset recovery, verification resend,
  owner login, protected refresh/navigation after sign-out, retry/error states,
  Sheet open/close/focus return, skip links and readable light/dark layouts at
  approximately 375px mobile and 1200px+ desktop widths.
- Public regressions: static/SSG build output, existing navigation/contact/resume
  behavior, sitemap exclusion and current JS/page/font/CSS budgets. Measure
  meaningful shared-style effects without adding a Lighthouse or browser harness.
- Live evidence: intended development branch/origin, owner-led mail-link setup
  and real session denial. Record separately from mock tests. Missing external
  prerequisites remain explicit verification limitations, not passing evidence.

## Notes for the AI

- Repository review confirms 16a/16b complete and 16c next. The current stack uses
  Prisma 7 and the pinned Managed Neon Auth SDK, superseding old Drizzle or
  self-hosted Better Auth wording. Do not reintroduce either integration.
- `blueprint/database-setup.md` records the existing owner as unverified and
  without a password, intentionally awaiting these screens. This is bootstrap
  work inside 16c, not a reason to add registration or create another account.
  Provider link verification is required and sign-up is disabled.
- Validate the actual installed SDK callback shape during implementation before
  adding status parsing. Unknown query parameters grant no authority. Prefer a
  neutral verification notice over claiming an unobserved verification success.
- The plan deliberately retains fixed navigation and omits a confirmation field,
  chooses the existing Sheet over a new sidebar dependency, exposes only Overview
  as a working destination and includes a parent error boundary for layout guards.
- All future business pages, metrics and client-facing access remain later work.
  Do not build fake data or dead destinations to fill out the prototype.
- Configured automatic Audit/Check/Try gates are manual; the done-when browser
  evidence still applies. Independent review is automatically selected here by
  `when-sensitive`. Follow its checkpoint rules during implementation/completion.
- This Feature command writes only the spec and generated activity state, then
  stops for spec review. Branch creation and code changes belong to `$implement`.

## Implementation evidence (in progress)

- Implemented auth forms, reset-token recovery, private route metadata/referrer
  policy, protected dashboard shell, loading and parent/content error boundaries.
  No dependencies or database models changed.
- `npx tsc --noEmit`, `npm run lint`, and `npm test` passed; Vitest reports
  32 files and 529 passing tests. `npm run build` passed, preserving all public
  routes as static/SSG; the login and dashboard routes are dynamic.
- Browser checks passed for desktop/mobile login rendering, both themes,
  validation and form-error focus, pending/invalid credentials, uniform email
  request notices, malformed reset-link recovery, neutral verification recovery,
  private metadata and signed-out dashboard denial. No auth-page console errors
  were observed. These checks do not prove an owner session or successful mail.
- Neon plugin verified the development branch and Auth endpoint, localhost
  allowance, disabled registration and required verification. Local owner and
  Auth endpoint settings match the recorded development setup.
- Resend plugin found three SMTP bridge requests rejected with HTTP 403:
  the configured root sender domain was unverified, while
  `contact.mohamedhnoor.com` was verified for sending. With explicit user approval,
  the development sender was corrected to `auth@contact.mohamedhnoor.com` through
  the Neon console and confirmed with the Neon plugin. Existing SMTP credentials
  and authorization policy were preserved. Local callbacks now use the approved
  ignored `.env.local` override rather than the production website.
- Resend plugin subsequently confirmed a fresh password-reset message was
  delivered at 2026-10-06 23:14 UTC. No message body or token URL was inspected.
  Delivery is proven; password setup and the resulting session remain separate
  owner-led checks.
- A second focused source sanity review found no introduced defects. This does
  not replace the configured immutable-checkpoint independent review.
- Public contact and resume pages rendered through their existing layouts after
  the shared style changes, without observed console errors. Production transfer
  budgets have not been measured against the development server.
- Auth UI follow-ups requested on 2026-10-07: reuse the website's existing
  light/dark `Logo` in the shared auth header and add an accessible eye button
  to the shared password field. Login and reset default to masked input; the
  show/hide button supports keyboard activation and cannot submit the form.
  TypeScript, targeted ESLint and 20 auth regression tests passed after these
  changes. Browser checks confirmed both controls, the logo's theme variants,
  desktop/mobile rendering and no console errors. The full build/test results
  above precede these UI follow-ups; refresh final gates before feature review.
- Owner confirmed password reset completed. Read-only Neon metadata showed the
  password was set and email verification was still outstanding. The reported
  login code `email_not_confirmed` was a normalized SDK code (HTTP 422), which
  the action incorrectly treated as unexpected. Installed-SDK inspection and an
  isolated offline reproduction confirmed the mismatch. The action now handles
  this code with raw-code compatibility; unrelated HTTP 403 responses are no
  longer misclassified as email-verification failures. Reset mappings also
  recognize the SDK's known `bad_jwt` and `weak_password` codes without treating
  generic validation failures as invalid links.
- Disabled Next 16.3.4 development Server Function logging through
  `logging.serverFunctions: false`, because its default argument logging exposed
  credentials during the owner's test. Application logging remains code-only.
  A dev-server restart and private password replacement were requested; no
  credentials or token URLs are recorded in this evidence.
- Focused repair checks passed: TypeScript, targeted ESLint and all 28 auth-action
  tests, including normalized SDK errors and unrelated forbidden responses.
- Refreshed final checks after the UI and SDK repairs: `npx tsc --noEmit`,
  `npm run lint`, `npm test` (32 files, 537 tests) and `npm run build` passed.
  The build still keeps public pages static/SSG and login/dashboard dynamic.
  Resend confirmed delivery of a verification message at 2026-10-06 23:53 UTC;
  verification completion and the resulting owner session remain unproven.
- 2026-10-07, resumed in Claude Code: `npx tsc --noEmit`, `npm run lint` and
  `npm test` (32 files, 547 tests) passed. Signed-out `curl` of `/dashboard`
  returned 307 to `/login`.
- Owner completed verification, login, the live dashboard, mobile navigation and
  sign-out privately, reporting that refreshing `/dashboard` after sign-out returns
  to `/login`. Read-only Neon queries on `development` showed one user with
  `emailVerified = true`. The only remaining session was created 48 ms after
  verification (23:53:16), i.e. the provider's automatic sign-in on the Neon Auth
  domain during link verification, never an app cookie. No app-login session
  survived sign-out, so sign-out revoked server-side, not only in the browser.
  No credentials, tokens or cookie values were inspected.
- UI polish requested on 2026-10-07 using the vendored `emil-design-eng` and
  `review-animations` guidance: a shared `AuthSubmitButton` gives every auth
  form the sign-out button's pending spinner; feedback and field errors reveal
  with a 200 ms opacity and 4 px rise; the password visibility icon swaps over
  150 ms (scale 0.6, opacity, 2 px blur); the auth card enters over 280 ms; the
  dashboard breadcrumb truncates instead of overflowing. All use the existing
  workspace ease-out curve, animate only transform/opacity/filter, and collapse
  under the site's reduced-motion baseline. Browser check at 320 px: error
  reveal, pending spinner with disabled submit, icon swap and accessible label
  change, feedback focus after an invalid-credentials response, no horizontal
  scroll and no console warnings or errors.
- Final gates after the polish: `npx tsc --noEmit`, `npm run lint`, `npm test`
  (32 files, 547 tests) and `npm run build` passed. Build output keeps every
  public page static/SSG; `/login`, `/reset-password`, `/dashboard` and the auth
  API are dynamic; `/forgot-password` and `/verify-email` prerender as static
  noindex shells with no session work.
- Budgets against `npm run build && next start` (port 3001), Chromium 1280 x 800,
  one fresh context per route, network idle plus 1.5 s, `transferSize` summed by
  type: JS 257.2 KB on site pages and 228.2 KB on `/resume` (ceiling 300); CSS
  16.6 KB (ceiling 25, up 2.0 KB from the workspace tokens and styles); fonts
  109.5 KB (ceiling 130); totals 398.3 KB (`/resume`) to 574.0 KB (`/`, ceiling
  600). All within ceilings.
- First independent review (claude-opus-5-5, fresh subagent, d2be82b..d38d496)
  passed, closing F-26 and raising F-28 to P2 and F-29 (P3). At the owner's
  request all open findings were then repaired in step 6.
- Repair checks: `npx tsc --noEmit`, `npm run lint` and `npm test` (33 files,
  580 tests) passed. Against the dev server, `/login?reset=done` showed the fixed
  notice while an HTML-bearing value and no value showed none;
  `GET /api/auth/get-session` returned 200 while `POST sign-up/email` and
  `POST request-password-reset` returned 404. The render-time cookie throw
  (F-28) is reproduced in Vitest against the real SDK with a stubbed upstream;
  a live reload after 60 seconds remains owner-led evidence.
- Independent review: a new review of the full delta is required for the repaired checkpoint.

## Findings

### 16c/F-25 [P2] closed - Signing a non-owner session back out cannot reach the session sign-in just created

**File:** src/actions/auth.ts:70
**Found:** 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests)
**Why it matters:** The spec says `signIn` "immediately signs that session out" when the SDK succeeds for a non-owner. The SDK's Next adapter reads outgoing auth cookies from the incoming request headers (`node_modules/@neondatabase/auth/dist/next/server/index.mjs:15-17`, `getCookies()` uses `headerStore`), not from the cookie store that `signIn.email` just wrote to (`dist/server-b0OzGjXl.mjs:1004`, `:1016`). The follow-up `auth.signOut()` therefore sends no session token, so the new upstream session is not revoked, and whether the browser cookie is cleared depends on what the upstream returns for a token-less sign-out. The `signOut` result is also ignored. The authorization boundary still holds, because `getOwner()` rejects any non-owner session and sign-up is closed, so this is defense in depth rather than a bypass. The unit test mocks the SDK and only asserts that `signOut` was called once (`tests/actions/auth.test.ts:76-81`), so it cannot see this.
**Suggested fix:** In the non-owner branch, clear the Neon Auth session cookies explicitly through `cookies()` from `next/headers` (the session-token and session-data cookie names the SDK exports), and either revoke with the returned token or record that revocation is best-effort. Add a test that asserts the cookies are cleared, not only that `signOut` was called.
**Resolution:**

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; d2be82b..d38d496): still open.** The non-owner branch at `src/actions/auth.ts:63-70` is unchanged in this delta, and the installed adapter still reads outgoing cookies from `headerStore` (`node_modules/@neondatabase/auth/dist/next/server/index.mjs:15-17`). The authorization boundary still holds (`getOwner()` rejects non-owners, sign-up is disabled per the 16c Neon read-back). P2, does not block `/complete`.

**Repaired 2026-10-07 in 16c step 6 (awaiting re-review).** The non-owner branch of `signIn` (`src/actions/auth.ts`) now logs a failed provider sign-out by code (`signIn.nonOwnerSignOut`) and calls `clearAuthCookies()`, which expires every `__Secure-neon-auth*` cookie through `cookies()` with `maxAge: 0`, `path: /` and `secure: true`. Upstream revocation is documented as best-effort. Tests assert the exact cookies cleared and their attributes, the failed sign-out log, and that an owner sign-in touches no cookies.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; d2be82b..7bdb941): closed.** `src/actions/auth.ts:53-60` (`clearAuthCookies`) and `:84-90` (non-owner branch). In a Server Action, Next's `cookies()` is backed by `requestStore.mutableCookies`, a `ResponseCookies` seeded from the request and updated by every `set` (`node_modules/next/dist/server/web/spec-extension/adapters/request-cookies.js:119-177`, `:180-201`), so `getAll()` does include the cookies the SDK's `signIn.email` just wrote through the same store, and the clear overwrites them. The SDK sets no cookie `domain` here (`createNeonAuth` gets no `cookies.domain`) and the prefix is `__Secure-neon-auth` (`dist/server-b0OzGjXl.mjs:294`), so `path: /`, `secure: true`, `maxAge: 0` matches and replaces them. The failed provider sign-out is logged by code only. Upstream revocation is documented as best-effort, which the original suggested fix allowed. Tests at `tests/actions/auth.test.ts:89-117` assert the exact cookies, attributes, code-only log and that owner sign-in clears nothing. No new defect introduced.

### 16c/F-26 [P2] closed - Any 403 from sign-in is reported to the owner as "verify your email", with nothing logged

**File:** src/actions/auth.ts:59
**Found:** 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests)
**Why it matters:** `code === "EMAIL_NOT_VERIFIED" || error.status === 403` treats every 403 as an unverified email. Better Auth also answers 403 for other refusals, notably an untrusted request origin. The SDK forwards the request's `Origin` (`dist/next/server/index.mjs:24-26`), and step 7's read-back lists only `https://www.mohamedhnoor.com` plus localhost as trusted, so a sign-in from an origin outside that list (for example a Vercel preview) would tell the owner to verify an already-verified email, and the real cause is never logged. Non-owners get `INVALID_CREDENTIALS`, so enumeration safety is not affected; the defect is a misleading result and a lost diagnostic.
**Suggested fix:** Map to `EMAIL_NOT_VERIFIED` only on the `EMAIL_NOT_VERIFIED` code. For any other 403, log the provider code with `logFailure` and return `UNEXPECTED`. Add a test for a 403 with a different code.
**Resolution:** Repaired in 16c (`d38d496`) and re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; d2be82b..d38d496): closed. `src/actions/auth.ts:59` now maps only the codes `email_not_confirmed` and `EMAIL_NOT_VERIFIED`; the `error.status === 403` clause is gone, so any other 403 falls through to `logFailure("signIn", code)` and `UNEXPECTED`. `tests/actions/auth.test.ts` adds a 403 `INVALID_ORIGIN` case asserting `UNEXPECTED`, a code-only log and no provider message in the result; the owner-only `EMAIL_NOT_VERIFIED` disclosure is preserved and tested for both codes. No new defect introduced by the repair.

### 16c/F-27 [P2] closed - The auth proxy exposes the whole upstream Better Auth API next to the guarded actions

**File:** src/app/api/auth/[...path]/route.ts:10
**Found:** 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests)
**Why it matters:** The route forwards every `GET`/`POST` path to Neon Auth (`dist/server-b0OzGjXl.mjs:1368-1385`, path taken from the URL). That includes request-password-reset, send-verification-email, sign-in, sign-up and the account-update endpoints. The actions' guarantees, "call the SDK only for `OWNER_EMAIL`" and enumeration-safe answers, therefore do not cover this second entry point. Closed sign-up, enumeration safety and abuse limits rest on the Neon branch settings and upstream Better Auth behavior, which this offline review cannot verify. Separately, neither path rate-limits owner reset or verification emails, and server-side SDK calls forward no client IP (`fetchWithAuth` at `dist/server-b0OzGjXl.mjs:926-930` sends only Cookie, Origin and a framework header), so upstream per-IP limits may bucket all action traffic under the server's address.
**Suggested fix:** In 16c, probe the proxied endpoints against the `development` branch (sign-up refused, reset and verification answers identical for unknown emails, rate limit observed). If anything other than session and email-link endpoints is reachable and unneeded, allowlist the paths the app actually uses in the route handler.
**Resolution:**

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; d2be82b..d38d496): still unverified.** The route handler is unchanged in this delta. The 16c spec evidence records a Neon read-back showing registration disabled and verification required on `development`, which addresses the sign-up part. The proxied reset/verification enumeration behavior and rate limits were not probed, and this offline review cannot probe them. P2 lead, does not block `/complete`.

**Repaired 2026-10-07 in 16c step 6 (awaiting re-review).** `src/app/api/auth/[...path]/route.ts` now forwards only `GET get-session` and `POST sign-out` and answers every other method/path with 404 without resolving the SDK (tests cover sign-up, sign-in, reset, verification, update-user, admin and nested paths; live dev-server probes returned 404 for sign-up and reset, 200 for get-session). Reset and verification actions now apply a per-visitor, per-action limit of 3 per 15 minutes using the shared `clientKey` and `checkRateLimit`; limited requests return the identical `{ sent: true }` and log only `rate_limited`, counted for owner and non-owner addresses alike. The limiter is per-instance, like the contact form's.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; d2be82b..7bdb941): closed.** `src/app/api/auth/[...path]/route.ts:10-28` checks `params.path.join("/")` against `GET get-session` / `POST sign-out` before resolving the SDK. The SDK's `authApiHandler` derives the upstream path from the same `params.path.join("/")` (`node_modules/@neondatabase/auth/dist/next/server/index.mjs` handler), so the allowlist and the forwarded path cannot diverge (an encoded `get-session%2F..%2Fsign-up` arrives as a single non-matching segment). The Server Actions call Neon directly through `fetchWithAuth`, not through this proxy, and email links are generated by Neon on its own domain, so the allowlist does not break reset or verification links (consistent with the recorded live flow). Reset and verification requests are limited per visitor and action (`src/actions/auth.ts:113-121`, `:135-139`), counted before the owner check, so the limited answer is identical for owner and non-owner addresses. Route tests cover the allowed pair and nine refused method/path combinations without reaching the SDK; action tests cover the limit, per-visitor isolation, non-owner counting and the unidentifiable-caller bypass. No new defect introduced. Residual: the limiter is per-instance and keyed on the first `x-forwarded-for` entry, the same accepted pattern as the contact form.

### 16c/F-28 [P2] closed - `requireOwner()` in a Server Component may throw when the SDK refreshes cookies

**File:** src/server/auth/session.ts:24
**Found:** 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests)
**Why it matters:** `getSession()` goes upstream once the 60-second session-data cookie expires. When the upstream answer carries `Set-Cookie`, the SDK writes it through `cookies().set` (`dist/server-b0OzGjXl.mjs:1004`, `:1016`; adapter at `dist/next/server/index.mjs:18-20`) without a guard. Next.js forbids cookie writes during Server Component rendering, so a 16c dashboard page calling `requireOwner()` could fail with an error instead of rendering or redirecting. No page calls it in 16b, and whether the upstream sets cookies on `get-session` was not verifiable offline.
**Suggested fix:** Cover this in 16c's browser verification: stay on a dashboard page past `sessionDataTtl` and reload. If it throws, refresh the session in a Route Handler or Server Action, or catch the write in the request context.
**Resolution:**

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; d2be82b..d38d496): still unverified, raised to P2.** 16c now makes the path reachable: `src/app/dashboard/layout.tsx:17`, `src/app/dashboard/page.tsx:11` and `src/app/(auth)/login/page.tsx:11` call `requireOwner()`/`getOwner()` during Server Component render. The project has no `proxy.ts`/`middleware.ts`, although the vendored SDK guidance (`.claude/skills/neon-auth/references/managed-auth.md:76`) pairs Server Component session reads with `auth.middleware()`, which is where the SDK refreshes the session-data cookie in a writable context (`dist/server-b0OzGjXl.mjs:1575-1603`). Without it, once the 60-second session-data cookie expires every protected render goes upstream, and any `Set-Cookie` the upstream returns reaches the unguarded `cookieStore.set` (`dist/next/server/index.mjs:18-20`, called from `dist/server-b0OzGjXl.mjs:1004`), which Next forbids during render; the throw would surface as the root "Unable to load this page" fallback rather than a redirect. The 16c spec evidence records the owner's live dashboard, mobile navigation and sign-out, but not a reload after more than 60 seconds or after the upstream session refresh window, so the trigger remains unconfirmed. Suggested next check: sign in, wait over 60 seconds, reload `/dashboard`; if it fails, add a matcher-scoped `proxy.ts` with `auth.middleware()` for `/dashboard/:path*` (and `/login`). Unverified, does not block `/complete`.

**Confirmed and repaired 2026-10-07 in 16c step 6 (awaiting re-review).** `tests/lib/auth/session-reader.test.ts` runs the real SDK with a stubbed upstream `get-session` that returns `Set-Cookie`: through the default Next adapter `getSession()` rejects with the render-time cookie error, confirming the defect. `getOwner()` now reads through `getSessionReader()` (`src/lib/auth/server.ts`), the SDK's exported `createAuthServer` with `readOnlyRequestContext`, whose `setCookie` is a no-op; the same test proves it returns the session without any cookie write. Vitest now inlines `@neondatabase/auth` so its `next/headers` import can be stubbed.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; d2be82b..7bdb941): closed.** `src/server/auth/session.ts:23-29` now reads through `getSessionReader()` (`src/lib/auth/server.ts:35-61`), a `createAuthServer` instance with the same base URL, cookie secret and 60-second TTL whose `setCookie` is a no-op. The SDK's `fetchWithAuth` routes every upstream `Set-Cookie` and the minted session-data cookie through `ctx.setCookie` (`dist/server-b0OzGjXl.mjs:992-1022`), so no render-time write can reach Next's cookie store. `tests/lib/auth/session-reader.test.ts` runs the real SDK with a stubbed upstream and proves both the original throw through `getAuth()` and its absence through the reader; this is meaningful evidence rather than a mirror of the implementation. Actions and the route handler keep the writable adapter. The repair's side effect (render reads never refresh auth cookies) is recorded separately as F-30 (P3); it does not reopen this finding. A live reload after 60 seconds remains owner-led evidence.

### 16c/F-29 [P3] closed - The reset submit button promises sign-in, and a successful reset lands on `/login` with no confirmation

**File:** src/components/auth/ResetPasswordForm.tsx:51
**Found:** 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests)
**Why it matters:** The button reads "Save password and sign in", but `resetPassword` only resets the password (no session is created; the owner's later manual login in the spec evidence confirms this) and the form then does `router.replace("/login")` at line 32. The owner arrives on an unchanged "Welcome back" sign-in card with no indication that the password was saved, which reads like a silent failure and contradicts the button label. The spec asks for "a clear path to sign in" after success; the path exists but the outcome is unannounced.
**Suggested fix:** Relabel the button "Save new password", and either show a fixed success notice before navigating or navigate to a fixed `/login?reset=1`-style flag that the login page maps to one constant "Password saved. Sign in with your new password." message (no callback text echoed).
**Resolution:**

**Repaired 2026-10-07 in 16c step 6 (awaiting re-review).** The button reads "Save new password"; success replaces the URL with `/login?reset=done`, and `loginNotice()` (`src/lib/auth/ui.ts`) maps only that exact value to the fixed `PASSWORD_SAVED_NOTICE`, rendered as a status notice on the login page. Tests cover the exact flag and reject empty, case-changed, array and HTML-bearing values; a dev-server check confirmed the notice renders only for the exact flag.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; d2be82b..7bdb941): closed.** `src/components/auth/ResetPasswordForm.tsx:31-33,49-51` labels the button "Save new password" and replaces the URL with `/login?reset=done`; `src/app/(auth)/login/page.tsx:16-24` renders `loginNotice()` (`src/lib/auth/ui.ts:17-21`), which returns the constant only for the exact string `done`, as a `role="status"` notice. No query text is rendered. `tests/lib/auth/ui.test.ts` covers the exact flag and rejects empty, case-changed, array and HTML-bearing values. No new defect introduced.

## Independent review

**Status:** passed
**Target commit:** 7bdb941a9646309bc7ea61374936d8ac14b9fcf6
**Base commit:** d2be82b9af99096afd6c0ad47e3ed954214ccc82
**Base ref:** origin/main
**Spec hash:** 165909bb980579a5e8832990cc2ab05a42d9ac06d401a4ce215720e2d0a5da9b
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-07T00:46:44Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-07T00:51:05Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `d2be82b9af99096afd6c0ad47e3ed954214ccc82..7bdb941a9646309bc7ea61374936d8ac14b9fcf6` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

### Commands

- `git rev-parse HEAD`, `git merge-base origin/main HEAD`, `shasum -a 256 blueprint/context/current-feature.md`, `git status --porcelain`: pass (target, base and spec hash match; only `blueprint/context/review.md` differed)
- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm test`: pass (33 files, 580 tests)
- `npm run build`: pass (public routes static/SSG; `/login`, `/reset-password`, `/dashboard`, `/api/auth/[...path]` dynamic; `/forgot-password`, `/verify-email` static)

### Evidence

- Reviewed the full `d2be82b..7bdb941` delta (48 files) and the active spec across all four lenses; existing findings used as context only.
- `src/app/api/auth/[...path]/route.ts` allowlist checks the same `params.path.join("/")` the SDK forwards upstream; Server Actions call Neon directly, so email links are unaffected.
- `clearAuthCookies` relies on Next's action-phase `mutableCookies` (`ResponseCookies` seeded from the request and updated on `set`), so cookies written by `signIn.email` are visible to `getAll()` and are expired with matching `path`/`secure` attributes.
- `getSessionReader()` routes all SDK cookie writes (`dist/server-b0OzGjXl.mjs:992-1022`) to a no-op; a real-SDK Vitest reproduces the render-time throw through the default adapter and its absence through the reader.
- `/login?reset=done` maps only the exact value to a constant notice; no query text is rendered. Reset token parsing rejects missing, repeated, non-string and oversized values.
- Dashboard layout and page both call `requireOwner()`; root and dashboard error boundaries render only a fixed message and `retry` (supported by Next 16.3.4's error boundary).
- Auth pages carry `noindex`/`nofollow`, metadata `no-referrer`, and a later `Referrer-Policy: no-referrer` header rule that overrides the global policy; request logging is suppressed for auth paths and Server Function argument logging is disabled.
- F-25, F-27, F-28 and F-29 re-examined against the new code and closed with evidence; F-24 remains fixed (P3, unverifiable offline).

### Findings

- F-30 [P3] open: render-time session reads never refresh auth cookies, so protected renders after 60 seconds always go upstream (`src/lib/auth/server.ts:39`).
- F-24 [P3] fixed: vendored-skill upstream identity not reproducible offline; unchanged in this delta.
- F-25, F-27, F-28 [P2] and F-29 [P3]: closed in this pass.

### Remaining risk

- Check was not required and was not run; no browser test command exists, so UI behavior rests on the builder's recorded browser evidence, not this review.
- Live Neon Auth behavior (reload after 60 seconds, session-token refresh, reset and verification links after the step 6 allowlist, upstream rate limits) was not exercised; this review was offline by contract.
- Public-route transfer budgets were not re-measured in this pass (no server started); the builder's recorded measurement is the only evidence.
- Email-request timing still differs between the owner address (network call) and other addresses; unchanged from 16b and not newly introduced here.
- The per-visitor email limiter is per-instance and keyed on the first `x-forwarded-for` entry, matching the contact form's accepted pattern.
