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

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; d2be82b..7bdb941): still fixed.** No vendored skill file changed in this delta (`git diff --stat` touches no `.claude/skills/` or `.agents/skills/` path). The upstream byte-identity claim still cannot be reproduced offline, so this pass does not close it. P3, does not block `/complete`.

### F-30 [P3] open - Render-time session reads never refresh auth cookies, so every protected render after 60 seconds goes upstream

**File:** src/lib/auth/server.ts:39
**Found:** 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests)
**Why it matters:** The F-28 repair gives `getOwner()` a reader whose `setCookie` is a no-op. The session-data cache cookie is minted only at sign-in (60-second TTL), and with no `proxy.ts` (forbidden by the standards) and no other writable read, nothing ever refreshes it. Every `/dashboard` and `/login` render after the first minute therefore makes an upstream `get-session` call to Neon Auth (confirmed by the code path in `dist/server-b0OzGjXl.mjs:1050-1060` and the reader test). Any refreshed session-token cookie the upstream sends (Better Auth extends sessions on `updateAge`) is also dropped, so the browser cookie keeps its original expiry and an active owner may be signed out at that point regardless of activity; whether Neon's managed configuration sends such a refresh was not verifiable offline. Impact is small for a single-owner dashboard today, but from feature 17 every protected page and action calls `requireOwner()` through this reader.
**Suggested fix:** Record the trade-off in `blueprint/dashboard-architecture.md` now. When feature 17 adds owner-guarded Server Actions, consider letting action-time owner checks use the writable `getAuth()` instance (cookie writes are allowed there), so ordinary dashboard use refreshes the session-data and session-token cookies without middleware.
**Resolution:**

### F-33 [P3] unverified - The client activity feed has no index that serves its `client_id` filter

**File:** src/server/queries/activity.ts:15
**Found:** 2026-10-09 by /audit (independent; scope: current; lens: performance)
**Why it matters:** `listClientActivity` filters `owner_id` and `client_id` and orders by `occurred_at DESC, id DESC` with `LIMIT 50`, but the only activity index is `(owner_id, occurred_at DESC)` (`prisma/models/activities.prisma:14`) and `client_id` has none. For a client with fewer than 50 activities Postgres must walk every one of the owner's activities. The `ON DELETE SET NULL` foreign key on `client_id` also has no supporting index. Negligible at today's single-owner volume and unmeasured; features 18 to 21 add project, milestone, task and payment activity to the same table, so the cost grows with the log.
**Suggested fix:** When a later migration touches `activities`, consider `(client_id, occurred_at DESC)` (and matching indexes for the per-project feeds), and confirm with `EXPLAIN` on a realistic row count.
**Resolution:**

### F-34 [P3] open - The client detail page loads the client's ownership twice, in series

**File:** src/app/dashboard/clients/[clientId]/page.tsx:32
**Found:** 2026-10-09 by /audit (independent; scope: current; lens: performance)
**Why it matters:** The page awaits `getClient(userId, clientId)` (one `ownedClient` lookup), then awaits `listClientActivity(userId, client.id)`, which runs `ownedClient` again (`src/server/queries/activity.ts:12`) before its `findMany`. Every detail render therefore makes three sequential Neon round trips after `requireOwner()`, one of them a repeat of a lookup the page already holds the result of. Unmeasured and small at single-owner volume, but it is the pattern features 18 to 22 will copy for project, milestone and payment detail pages.
**Suggested fix:** Either run the two loaders with `Promise.all` (both already raise `NotFoundError` for a missing, malformed or foreign id), or give the activity query a variant that takes an already-owned client and skips the second ownership check.
**Resolution:**

### F-35 [P3] open - An empty country cell in the clients table renders a bare em dash

**File:** src/components/dashboard/clients/ClientTable.tsx:49
**Found:** 2026-10-09 by /audit (independent; scope: current; lens: quality)
**Why it matters:** A client without a country code shows a lone U+2014 in the Country column, which screen readers read as "em dash" or skip, while the detail page says "Not provided" for the same empty value. The writing standard also rules out em dashes in generated content.
**Suggested fix:** Render "Not provided" (or a visually short mark with sr-only "Not provided" text) so the list and detail pages describe an empty value the same way.
**Resolution:**
