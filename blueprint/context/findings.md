# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-24 [P3] fixed - Vendored third-party agent skills were not verified against their pinned upstream commits

**File:** .claude/skills/VENDOR-SOURCES.md:1
**Found:** 2026-10-07 by /audit (independent; scope: current; lens: security)
**Why it matters:** Commit `68aa3ec` adds 18 third-party skills (9 Prisma, 9 Neon), duplicated under `.claude/skills/` and `.agents/skills/` (192 markdown files, about 30k lines). Skills auto-load as agent instructions in later sessions, so their content is a trust boundary. This pass confirmed offline that every file is markdown (no scripts, hooks or `allowed-tools` frontmatter), that both adapter copies are identical, and that destructive commands (`db push --force-reset`/`--accept-data-loss`, `migrate reset`) appear only as reference text gated on explicit user consent. It also found guidance that differs from this project's boundaries, for example global CLI installs and provisioning (`.claude/skills/neon/SKILL.md:69`, `:182`, `:195-216`) and `npx -y @prisma/cli@latest` (`.claude/skills/prisma-postgres-setup/references/provisioning.md:10`). The only project guard is the closing paragraph of `VENDOR-SOURCES.md`, which no skill loads; `AGENTS.md` approval rules still apply regardless. Whether the files match the pinned upstream commits could not be checked without network access.
**Suggested fix:** Compare the vendored trees against the pinned commits recorded in `VENDOR-SOURCES.md` (for example, a local clone at those SHAs and `diff -r`) before relying on them, and consider one line in `AGENTS.md` noting that vendored skills are reference only and never authorize provisioning, global installs, migrations or auth-provider changes.
**Resolution:** Step 7, with the owner's approval: shallow-fetched `prisma/skills@be16a874` and `neondatabase/agent-skills@9e4a5705` into the session scratchpad. `diff -rq` shows all 18 skills byte-identical to upstream in both adapter folders. `AGENTS.md` now states that vendored skills are reference only and never authorize provisioning, global installs, migrations, deployments or auth-provider changes.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..d060cf0): still fixed.** Confirmed offline: the `AGENTS.md` guard line is present (`AGENTS.md:119-123`), `VENDOR-SOURCES.md` pins `prisma/skills@be16a874` and `neondatabase/agent-skills@9e4a5705`, all 18 vendored skills are byte-identical between `.claude/skills/` and `.agents/skills/`, and the 192 files are markdown only with destructive commands appearing only as consent-gated reference text. The upstream byte-identity claim could not be reproduced without network access and no local clone at the pinned SHAs exists, so this pass does not close it. P3, does not block `/complete`; a reviewer with an approved local clone can close it with `diff -rq`.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..88bf4f4): still fixed.** No vendored skill file changed in `d060cf0..88bf4f4`. All 18 skills remain identical between `.claude/skills/` and `.agents/skills/`, every tracked file under them is markdown, and the `AGENTS.md` guard line is still present. The upstream comparison still cannot be reproduced offline, so this pass does not close it. P3, does not block `/complete`.

### F-25 [P2] open - Signing a non-owner session back out cannot reach the session sign-in just created

**File:** src/actions/auth.ts:70
**Found:** 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests)
**Why it matters:** The spec says `signIn` "immediately signs that session out" when the SDK succeeds for a non-owner. The SDK's Next adapter reads outgoing auth cookies from the incoming request headers (`node_modules/@neondatabase/auth/dist/next/server/index.mjs:15-17`, `getCookies()` uses `headerStore`), not from the cookie store that `signIn.email` just wrote to (`dist/server-b0OzGjXl.mjs:1004`, `:1016`). The follow-up `auth.signOut()` therefore sends no session token, so the new upstream session is not revoked, and whether the browser cookie is cleared depends on what the upstream returns for a token-less sign-out. The `signOut` result is also ignored. The authorization boundary still holds, because `getOwner()` rejects any non-owner session and sign-up is closed, so this is defense in depth rather than a bypass. The unit test mocks the SDK and only asserts that `signOut` was called once (`tests/actions/auth.test.ts:76-81`), so it cannot see this.
**Suggested fix:** In the non-owner branch, clear the Neon Auth session cookies explicitly through `cookies()` from `next/headers` (the session-token and session-data cookie names the SDK exports), and either revoke with the returned token or record that revocation is best-effort. Add a test that asserts the cookies are cleared, not only that `signOut` was called.
**Resolution:**

### F-26 [P2] open - Any 403 from sign-in is reported to the owner as "verify your email", with nothing logged

**File:** src/actions/auth.ts:59
**Found:** 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests)
**Why it matters:** `code === "EMAIL_NOT_VERIFIED" || error.status === 403` treats every 403 as an unverified email. Better Auth also answers 403 for other refusals, notably an untrusted request origin. The SDK forwards the request's `Origin` (`dist/next/server/index.mjs:24-26`), and step 7's read-back lists only `https://www.mohamedhnoor.com` plus localhost as trusted, so a sign-in from an origin outside that list (for example a Vercel preview) would tell the owner to verify an already-verified email, and the real cause is never logged. Non-owners get `INVALID_CREDENTIALS`, so enumeration safety is not affected; the defect is a misleading result and a lost diagnostic.
**Suggested fix:** Map to `EMAIL_NOT_VERIFIED` only on the `EMAIL_NOT_VERIFIED` code. For any other 403, log the provider code with `logFailure` and return `UNEXPECTED`. Add a test for a 403 with a different code.
**Resolution:**

### F-27 [P2] unverified - The auth proxy exposes the whole upstream Better Auth API next to the guarded actions

**File:** src/app/api/auth/[...path]/route.ts:10
**Found:** 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests)
**Why it matters:** The route forwards every `GET`/`POST` path to Neon Auth (`dist/server-b0OzGjXl.mjs:1368-1385`, path taken from the URL). That includes request-password-reset, send-verification-email, sign-in, sign-up and the account-update endpoints. The actions' guarantees, "call the SDK only for `OWNER_EMAIL`" and enumeration-safe answers, therefore do not cover this second entry point. Closed sign-up, enumeration safety and abuse limits rest on the Neon branch settings and upstream Better Auth behavior, which this offline review cannot verify. Separately, neither path rate-limits owner reset or verification emails, and server-side SDK calls forward no client IP (`fetchWithAuth` at `dist/server-b0OzGjXl.mjs:926-930` sends only Cookie, Origin and a framework header), so upstream per-IP limits may bucket all action traffic under the server's address.
**Suggested fix:** In 16c, probe the proxied endpoints against the `development` branch (sign-up refused, reset and verification answers identical for unknown emails, rate limit observed). If anything other than session and email-link endpoints is reachable and unneeded, allowlist the paths the app actually uses in the route handler.
**Resolution:**

### F-28 [P3] unverified - `requireOwner()` in a Server Component may throw when the SDK refreshes cookies

**File:** src/server/auth/session.ts:24
**Found:** 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests)
**Why it matters:** `getSession()` goes upstream once the 60-second session-data cookie expires. When the upstream answer carries `Set-Cookie`, the SDK writes it through `cookies().set` (`dist/server-b0OzGjXl.mjs:1004`, `:1016`; adapter at `dist/next/server/index.mjs:18-20`) without a guard. Next.js forbids cookie writes during Server Component rendering, so a 16c dashboard page calling `requireOwner()` could fail with an error instead of rendering or redirecting. No page calls it in 16b, and whether the upstream sets cookies on `get-session` was not verifiable offline.
**Suggested fix:** Cover this in 16c's browser verification: stay on a dashboard page past `sessionDataTtl` and reload. If it throws, refresh the session in a Route Handler or Server Action, or catch the write in the request context.
**Resolution:**
