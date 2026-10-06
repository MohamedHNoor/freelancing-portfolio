# Fix: Prisma ORM and Neon Managed Better Auth

**Type:** Fix
**Status:** verified
**Branch:** `fix/prisma-neon-auth`

## The problem

Before 16b starts, the owner chose a different data and identity stack for the
private dashboard:

- **ORM:** Prisma ORM instead of Drizzle.
- **Auth:** Neon's Managed Better Auth (`@neondatabase/auth`) instead of a
  self-hosted Better Auth library.

Feature 16a shipped a Drizzle foundation with these pieces:

- `drizzle.config.ts`
- a Drizzle `getDb()`
- an unapplied initial SQL migration of the five self-hosted Better Auth tables
- a pinned offline `auth@1.6.33` schema generator, with tests

The plans described that stack throughout.

## The fix

Replace the ORM and hand identity to Neon, without changing the public site or
the 16a guarantees:

- Lazy, server-only database access.
- Redacted env validation.
- Offline generation with no private env reads.
- Live tools only behind the direct URL and a separate approval.

Managed Better Auth owns `user`, `session`, `account` and `verification` in each
branch's `neon_auth` schema. The app therefore keeps no auth tables, schema
generator or migration. Nothing was applied anywhere, so nothing needs migrating.

Wiring the auth SDK and routes stays in 16b, following Neon's Next.js "API
methods" quickstart.

## Build steps

- [x] **1. Dependencies.** Remove `drizzle-orm`, `drizzle-kit`, `better-auth` and
  `auth`. Add `@prisma/client`, `@prisma/adapter-pg` and `prisma`, all pinned to
  7.10.0 (npm's `latest` tag on `prisma` is an 8.0 RC). Add `postinstall` and
  `db:generate`/`db:migrate`/`db:studio` scripts on Prisma, and drop `auth:generate`.
  - **Done when:** the install regenerates the client into git-ignored
    `src/generated/prisma`.
- [x] **2. Prisma foundation.**
  - `prisma/schema.prisma` holds the generator and datasource, with no models yet.
  - `prisma.config.ts` uses directory schemas and `prisma/migrations`, with a
    per-command datasource. Live `migrate deploy`/`studio` load env files and
    require `DATABASE_URL_UNPOOLED`. Everything else gets the unroutable
    `postgresql://offline.invalid/offline`, because Prisma 7.10's schema engine
    needs a URL even for an offline diff.
  - `getDb()` keeps the same lazy attached `pg` pool and returns
    `new PrismaClient({ adapter: new PrismaPg(pool) })`.
  - **Done when:** `prisma validate` passes, offline `migrate diff --from-empty`
    runs with no env, and `migrate deploy` without a URL fails closed, naming
    only the variable.
- [x] **3. Remove the self-hosted auth schema.** Delete `drizzle/`,
  `drizzle.config.ts`, `src/db/schema/`, the auth generator script and config,
  `src/lib/auth-schema.ts` and their three test files.
  - **Done when:** no source or test imports remain.
- [x] **4. Tests.** Rewrite `tests/db/index.test.ts` for Prisma (laziness, pool
  options and attachment, adapter wiring, retry, failure propagation) and
  `tests/lib/validation/database-tooling.test.ts` for the live/offline split.
  - **Done when:** `npm test` passes.
- [x] **5. Plans and docs.** Update `AGENTS.md`, `database-setup.md`,
  `dashboard-architecture.md` (R2-R5, §1-§7, §15-§21, §26, §29-§34, §36, risks),
  `build-plan.md` (16, 16a, 16b), `project-plan.md`, `project-overview.md` and
  `coding-standards.md`. History archives stay as shipped.
  - **Done when:** no plan describes Drizzle or self-hosted Better Auth as
    current.

- [x] **6. Audit repairs (F-18, F-21, F-22, F-23).**
  - Document the full external-table setup for `neon_auth.user`: the experimental
    flag, multi-schema, `initShadowDb`, and a stub for integration databases.
  - Correct the `bigint` safe-integer rule.
  - Drop the unverified SDK logging claim.
  - Add a no-mock adapter test proving `PrismaPg` uses the attached pool.
  - **Done when:** the docs match the offline-verified Prisma 7.10 behaviour, and
    `npm test` passes with the new test.

- [x] **7. Repair every remaining open finding**, at the owner's request
  on 2026-10-07:
  - **F-07:** the contact limiter keys on the first *non-empty*
    `x-forwarded-for` element and skips when there is none, with tests.
  - **F-08:** remove past-tense narration from source comments.
  - **F-15:** keep the `PointGrid` trailing cell out of the list.
  - **F-16:** hold the reply time once in `src/lib/site.ts`.
  - **F-17:** the owner confirmed the client claim is true, so the plan rule and
    the two comments change to match.
  - **F-24:** diff the vendored skills against their pinned upstream commits,
    and add an `AGENTS.md` guard line.
  - **F-25:** route `migrate status` and `migrate resolve` to the live tools,
    with tests and a recovery procedure.
  - **Done when:** each finding's suggested fix is in place, and the full gate
    passes.

- [x] **8. Prisma's Next.js guidance** (owner-supplied troubleshooting page,
  2026-10-07):
  - `build` and `preflight` run `prisma generate` before `next build`, so a
    restored Vercel dependency cache, or an install without scripts, can never
    leave `src/generated/prisma` missing.
  - `getDb()` reuses one client through `globalThis` outside production, so dev
    hot reloads stop creating new clients and pools.
  - **Done when:** both builds pass from a deleted generated folder, and tests
    cover the reuse and the production behaviour.

## Decisions for review

- **Closed sign-up.** Managed Better Auth has no sign-up hooks and its endpoint is
  public, so R4 becomes: sign-up disabled per branch, owner account created once
  per branch, and `requireOwner()` accepts only a verified `OWNER_EMAIL` session.
  There is no register page. 16b fixes how the owner account is created.
- **`owner_id` type.** It becomes `uuid`, referencing `neon_auth.user(id)` through
  a read-only Prisma model listed under `tables.external` (from feature 17).
- **Auth emails** are sent by Neon. Verification links and production need custom
  SMTP, planned as Resend's SMTP relay.
- **Session cache.** The SDK caches session data in a signed cookie. The plan sets
  `sessionDataTtl: 60`, so revocation takes up to a minute.
- **2FA gap.** Two-factor sign-in is not available on Managed Better Auth today
  (roadmap only). Feature 23 plans it; recorded as a risk and open question.
- **Migrations after the first one** need a disposable shadow database
  (`migrate diff --from-migrations`). The first migration, in feature 17, can be
  authored offline.

## Verify

Commands:

```sh
npx tsc --noEmit
npm run lint
npm test
npm run build
env DATABASE_URL= DATABASE_URL_UNPOOLED= TEST_DATABASE_URL= npm run build
npx prisma validate
npx prisma migrate diff --from-empty --to-schema prisma --script
```

Evidence (2026-10-07):

- **Typecheck and lint:** clean.
- **Tests:** 21 files, 423 tests pass, including the no-mock adapter test and the step 7 limiter and tooling cases.
- **Builds:** both pass. All 19 public route entries are static/SSG, and no
  auth or dashboard endpoint exists.
- **Prisma:** `prisma validate` passes, and the offline diff prints an empty
  migration.
- **Live commands:** none were run against a database.

`npm audit`: 18 advisories here versus 24 on `main`. The `prisma` CLI adds
transitive dev-only advisories:

- `deepmerge-ts`, via `@prisma/config`
- `mysql2`

Neither is reachable in this PostgreSQL-only, local-CLI use, and npm's only
offered fix is a downgrade to Prisma 6.

## Findings

### prisma-neon-auth/F-07 [P2] closed - Every visitor shares one rate-limit bucket when `x-forwarded-for` is absent or its first element is empty

**File:** src/actions/contact.ts:136
**Found:** 2026-09-09 by /audit (independent; scope: current; lens: security)
**Why it matters:** The limiter key is
`forwardedFor?.split(",")[0]?.trim() ?? "unknown"`. Two reachable inputs collapse
every caller into a single shared bucket, and the bucket is three submissions per
ten minutes:

- **Header absent** gives the literal key `"unknown"`. `headers().get()` returns
  `null` whenever nothing upstream sets `x-forwarded-for`: `npm run start` reached
  directly, a self-hosted container with no proxy in front, or any host whose
  proxy does not add the header. On such a deployment the limit stops being
  per-visitor and becomes **site-wide**: the fourth genuine enquiry from any
  visitor inside ten minutes is refused with "That is a few messages in a short
  time", and nothing is sent. That is a false positive on the one path the whole
  site exists to feed, and the visitor is told to try again later rather than
  that anything is wrong.
- **An empty first element** gives the key `""`. Reproduced: `""`,
  `", 203.0.113.9"` and `"  , 203.0.113.9"` all key on `""`. On an appending
  proxy, a client that sends `X-Forwarded-For:` with an empty value has the real
  address appended after it, so the leftmost element stays empty and the key is
  client-selectable. The practical impact is narrower than the case above, since
  an ordinary visitor's leftmost element is their real address, but it means the
  shared bucket can be filled deliberately.

This is not the spoofing concern from F-04, which was about a caller minting
*fresh* keys to evade the ceiling and which the spec accepts. This is the
opposite direction: distinct legitimate visitors being *merged* into one key and
blocked. The spec's Data / contracts does say the action "falls back to a
constant when absent", so the fallback is as designed, but the consequence of
that constant, a global rather than light limit, is not what the spec describes
the limiter as doing ("raises the cost of a script and nothing more").

`src/actions/contact.ts` has no test for key derivation at all: every case in
`tests/actions/contact.test.ts` sets a single well-formed address, so neither the
absent-header path nor the empty-element path is exercised.

**Suggested fix:** Treat an unusable key as "cannot identify this caller" rather
than as one shared identity. Either skip the limiter when no usable element is
present, which restores the documented "light" behaviour and fails open on the
conversion path, or pick the first **non-empty** element and skip when there is
none. Whichever is chosen, add tests for a missing header, an empty leftmost
element, and a normal appended chain, since none of those three is covered today.
**Resolution:** Step 7 of `fix/prisma-neon-auth`: `clientKey()` in `src/actions/contact.ts` keys on the first non-empty `x-forwarded-for` element and skips the limiter when there is none. Three new tests in `tests/actions/contact.test.ts` cover a missing or blank header, an empty leftmost element and an appended chain. The first two fail against the old code.

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; d9304aa..c3db156): still open.** `src/actions/contact.ts` is in this delta (new fields, honeypot rename, labelled email body), but the limiter key is unchanged and now sits at line 147: `forwardedFor?.split(",")[0]?.trim() ?? "unknown"`. `tests/actions/contact.test.ts` still sets one well-formed address per test, so neither the absent-header nor the empty-element path is exercised. P2, does not block `/complete`.

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; lens: quality, security, performance, tests; d9304aa..ee226e0): still open.** The repair checkpoint did not touch the limiter. `src/actions/contact.ts:146-147` still keys on `forwardedFor?.split(",")[0]?.trim() ?? "unknown"`, and `tests/actions/contact.test.ts` never sets `forwardedFor` to `null` or to a value with an empty first element (every assignment is a well-formed address from `freshIp()` or a fixed IP). P2, does not block `/complete`.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..d060cf0): closed.** `clientKey()` (`src/actions/contact.ts:78-88`) splits `x-forwarded-for`, trims, and takes the first non-empty element; `submitContact` (`:151-155`) skips the limiter only when the key is `null`. The absent-header and empty-leftmost paths no longer collapse into a shared bucket, and the empty leftmost element is no longer client-selectable as a key. Three new tests in `tests/actions/contact.test.ts:230-259` cover a missing/blank header, an empty leftmost element, and an appended chain; all pass. No new defect introduced: the fail-open on an unidentifiable caller is the documented choice and matches the spec's "light" limiter.

### prisma-neon-auth/F-08 [P3] closed - Source comments narrate the previous implementation and the review that replaced it

**File:** src/actions/contact.ts:44
**Found:** 2026-09-09 by /audit (independent; scope: current; lens: quality)
**Why it matters:** The repair commit added doc comments that describe code which
is no longer there, and the review history that removed it, in files a reader
will consult for current behaviour:

- `src/actions/contact.ts:44-58`, 15 lines on a 16-line function, covering
  "Keying it to `email` and `message` alone was wrong in a way that lost mail"
  and "The previous version used a literal U+0000 for that".
- `src/lib/links.ts:56-69`, "An earlier version enumerated the dangerous
  characters instead and missed the one that matters most".
- `src/lib/rate-limit.ts:29-38`, "The first loop is the actual repair: the
  earlier version pruned timestamps inside an entry but never removed the entry".
- Smaller instances at `src/actions/contact.ts:81-85` and
  `src/actions/contact.ts:105-110`.

`coding-standards.md` is explicit about this: "Keep doc comments minimal", a
comment "earns its place only when it captures something the code can't", and
"Over-commenting is a common AI tell, so resist it". The *decisions* here do earn
their place, and should stay: why the display name is quoted rather than filtered,
why a rejected call is not recorded, why `company` is excluded from the hash.
What does not is the before-and-after narration around them. It is a second,
unversioned copy of what git history and this ledger already hold, `/complete`
will archive these findings as `10/F-01` and so on, and nothing will keep the
comments in step once the next change lands.

This is a judgement call rather than a defect, and the surrounding codebase does
favour explanatory comments, so length alone is not the issue. What is new in this
delta is the past-tense narration of replaced code, which no comment at the base
commit does. The equivalent comments in the tests are appropriate and should
stay: a regression test should say which regression it guards.

**Suggested fix:** Keep the sentence that states the current decision and drop
the sentences describing what the code used to do. At `src/lib/rate-limit.ts:29`
that is roughly two lines instead of ten.
**Resolution:** Step 7 removed the past-tense narration from `src/actions/contact.ts` (idempotency key), `src/lib/links.ts`, `src/lib/rate-limit.ts`, `src/lib/validation/contact.ts` and the `src/content/projects.ts` header, keeping the current-decision sentences.

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; d9304aa..c3db156): still open.** This delta rewrote the honeypot comment at `src/actions/contact.ts:116-121` from past-tense narration into a present-tense rule, which is the shape this finding asks for. The other cited narration remains: `src/actions/contact.ts:47-61` ("Keying it to `email` and `message` alone was wrong", "The previous version used a literal U+0000") and `src/lib/links.ts:58-59` ("An earlier version enumerated the dangerous characters"). `src/lib/rate-limit.ts` is untouched by this delta and was not re-read for closure. The delta also adds two small instances of the same pattern: `src/lib/validation/contact.ts:151` ("It was `company` until that became a real field.") and the header of `src/content/projects.ts:7-12`, which narrates how TravelGrid's figures used to differ. P3, does not block `/complete`.

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; lens: quality, security, performance, tests; d9304aa..ee226e0): still open.** Unchanged by the repair checkpoint. The narration is still at `src/actions/contact.ts:47-61`, `src/lib/links.ts:58-63`, `src/lib/rate-limit.ts:31-33` and `src/lib/validation/contact.ts:151`. The repair's own new comments (the honeypot `data-*` hints in `ContactForm.tsx:265-267`, `PointGrid`'s `reveal` prop, `BACKGROUND_LINKS`) state current behaviour and add no new instance. P3, does not block `/complete`.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..d060cf0): closed.** Re-read `src/actions/contact.ts`, `src/lib/links.ts`, `src/lib/rate-limit.ts`, `src/lib/validation/contact.ts` and the `src/content/projects.ts` header: the cited past-tense narration is gone and each comment now states only the current decision. A search for "earlier version", "previous version", "was wrong", "It was" and "used to" in those files finds nothing.

### prisma-neon-auth/F-15 [P3] closed - The "seven steps" ordered list on /process announces eight items, the eighth being the call to action

**File:** src/components/primitives/PointGrid.tsx:57
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: quality)
**Why it matters:** `PointGrid` renders `trailing` as one more `<li>` inside the
same list. On `/process` that list is the numbered `<ol>` of steps, labelled by
the `sr-only` heading "The seven steps" (`src/app/process/page.tsx:38-48`). The
prerendered `/process` has 8 `<li>` in that `<ol>`, so a screen reader announces
"list, 8 items" under a heading that says seven, and reads the Start a Project
card as item 8 of the process. `PointCard`'s own comment
(`PointGrid.tsx:67`, "Decorative: an `ol` already announces position") relies on
the list position being the step number, which the trailing item breaks. Sighted
users see 01 to 07 and an unnumbered card, so the two audiences get different
structures. Not a WCAG A or AA failure, which is why an axe run would not flag it,
but `coding-standards.md` treats accessibility semantics on this site as a
product claim. On `/`, `Reasons` uses an unordered list, where the extra item is
harmless.
**Suggested fix:** Keep the trailing cell out of the list: render the list and
the trailing cell as siblings inside one grid wrapper (the `ol` as
`display: contents`, or a wrapping `div` that owns the grid), or accept
`trailing` only when `numbered` is false. The visual layout stays the same.
**Resolution:** Step 7: `PointGrid` renders `trailing` as a sibling of the list inside a grid wrapper, with the list set to `display: contents`. The prerendered `/process` `<ol>` now has 7 `<li>`, and the CTA sits outside it. The visual layout was not checked in a browser.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..d060cf0): closed.** `PointGrid` now renders the list as `display: contents` (keeping explicit `role="list"`) with `trailing` as a sibling grid cell (`src/components/primitives/PointGrid.tsx:43-73`). The prerendered `.next/server/app/process.html` from this pass's build has 7 `<li>` in the `<ol role="list" class="contents">`, and the Start a Project card is outside it. The no-trailing path is unchanged. Visual layout was not browser-checked in this pass.

### prisma-neon-auth/F-16 [P3] closed - The one-business-day reply promise is hard-coded in five places, and its comment says to change it "in both places"

**File:** src/components/sections/FinalCta.tsx:12
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: quality)
**Why it matters:** `FinalCta` says "The reply time is a commitment, not a
flourish, and it is repeated on `/contact`. If it stops being true, change it in
both places first." This delta spreads the same commitment to five strings in
four files: `src/app/contact/page.tsx:11` (metadata) and `:29` (lead),
`src/components/sections/FinalCta.tsx:23`, `src/components/primitives/StartProjectCard.tsx:18`
and `src/components/projects/CaseStudyCta.tsx:28`. A maintainer who follows the
comment updates two and leaves three public pages promising a reply time the
business no longer keeps. The project's own rule is that a promise on this site
must stay literally true.
**Suggested fix:** Hold the reply time once in the content layer (for example
`profile.replyTime`, or a constant beside `PRIMARY_CTA`) and interpolate it in all
five strings, then drop the "both places" instruction. Or, at minimum, correct the
comment to name every location.
**Resolution:** Step 7 added `REPLY_TIME` to `src/lib/site.ts` beside `PRIMARY_CTA` and interpolated it in all five strings (the `/contact` metadata and lead, `FinalCta`, `StartProjectCard`, `CaseStudyCta`). It dropped the "both places" comment.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..d060cf0): closed.** `REPLY_TIME` is defined once in `src/lib/site.ts:158-160` and interpolated in all five strings (`/contact` metadata and lead, `FinalCta`, `StartProjectCard`, `CaseStudyCta`). No literal "within one business day" remains in `src/` outside `site.ts`, and the "both places" comment is gone.

### prisma-neon-auth/F-17 [P3] closed - Copy in four places reads as a claim of existing clients across New Zealand, Australia and internationally

**File:** src/components/sections/Location.tsx:15
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: quality)
**Why it matters:** `blueprint/project-plan.md:63-65` says "the site never implies
existing clients in any country", and the code says the same:
`Location.tsx:3-5` ("without implying clients in any country: it says where the
work can be, not where it has been") and `src/content/profile.ts:57` ("never a
claim about where past clients were"). The rendered copy reads the other way:
`Location.tsx:15` "I'm based in Wellington and work with businesses, startups and
agencies across New Zealand, Australia and internationally",
`src/content/approach.ts:28` "working with clients across New Zealand, Australia
and internationally", `src/app/about/page.tsx:21` "working with businesses,
startups and agencies across...", and the `/about` label "Working with clients
in" (`src/components/detail/AboutDetail.tsx:47`). Present-tense "work with ...
across" is most naturally read as a description of a current client base. This
reviewer cannot tell whether that is true, and the wording comes from the owner's
brief, so this is a lead rather than a confirmed defect: either the copy or the
plan's rule and the two comments are wrong, and only the owner can say which.
**Suggested fix:** If there are no clients in Australia or abroad yet, reword to
availability ("available to businesses, startups and agencies across New
Zealand, Australia and internationally"; label "Available to clients in"). If
there are, amend the project plan's rule and the two comments so they match.
**Resolution:** On 2026-10-07 the owner confirmed the claim is true. Step 7 amended the rule in `blueprint/project-plan.md` and `project-overview.md`, and the comments in `Location.tsx` and `profile.ts`, to match the copy. The copy is unchanged.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..d060cf0): closed.** The owner's 2026-10-07 confirmation is recorded; `blueprint/project-plan.md:63-67`, `project-overview.md`, `Location.tsx:4-6` and `profile.ts:48-49` now agree with the rendered copy, and the rule still forbids naming clients or locations that cannot be backed up. No copy changed.

### prisma-neon-auth/F-18 [P2] closed - The `neon_auth.user` reference plan omits Prisma 7.10's required external-table setup

**File:** blueprint/database-setup.md:70
**Found:** 2026-10-07 by /audit (scope: current; lens: quality)
**Why it matters:** The plans tell feature 17 to model `neon_auth.user`
read-only, list it under `tables.external`, and point `owner_id` foreign keys at
it. The same instruction appears in `dashboard-architecture.md:135`, `:351` and
`:881`. Followed as written, that fails in three places. An offline
reproduction against the installed 7.10.0 CLI in a scratch folder showed:

- **Config load fails.** `tables.external` alone stops with "The
  `tables.external` configuration requires `experimental.externalTables` to be
  set to `true`".
- **Validation fails.** Without `schemas = ["public", "neon_auth"]` on the
  datasource, a model with `@@schema("neon_auth")` does not validate. Once
  multi-schema is on, every model needs `@@schema`.
- **Shadow replay fails.** With both settings, the offline diff is correct: it
  creates only `clients` and emits `REFERENCES "neon_auth"."user"("id") ON
  DELETE RESTRICT`. That same foreign key cannot be replayed into the
  "disposable, empty" shadow database that `database-setup.md:104-106` calls
  for, because that database has no `neon_auth.user`.

The shadow-replay failure is the most serious. Prisma provides
`migrations.initShadowDb` (an SQL script that creates external tables before
diffing; see `node_modules/@prisma/config/dist/index.d.ts:127-131`), and the
plans never mention it. The local-PostgreSQL integration option in architecture
§30 has the same gap. External tables are also an experimental Prisma feature,
which the risks do not record.

**Suggested fix:** In `database-setup.md` and architecture §4, §6, §30 and §34,
document:

- `experimental: { externalTables: true }`
- the `schemas` list and `@@schema` on every model
- a `migrations.initShadowDb` script that creates a minimal
  `neon_auth.user (id uuid primary key)`
- the same stub for a local integration database, or integration runs limited
  to Neon branches with Auth enabled

Add the experimental flag to the phase 2b risks.
**Resolution:** Step 6 documented `experimental.externalTables`, the `schemas` list with `@@schema` on every model, the read-only `NeonAuthUser` model, `migrations.initShadowDb`, and the local integration stub, in `database-setup.md` and architecture §4, §6, §30 and §34. The experimental status is now in the 2b risks.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..e044108): closed.** Step 6 documented the external-table setup in `database-setup.md:70-89` and architecture §4 (`dashboard-architecture.md:131-135`), §6 (`:351`), §30 and §34 (`:881`), plus the experimental-status risk. Re-checked offline against the installed 7.10.0 types: `node_modules/@prisma/config/dist/index.d.ts` declares `experimental.externalTables` (line 69), `tables.external` (54), `migrations.initShadowDb` (131) and `datasource.shadowDatabaseUrl` (28), matching the docs. No new defect introduced; the docs keep `shadowDatabaseUrl` deferred to feature 17, which is consistent with the offline config today.

### prisma-neon-auth/F-19 [P2] closed - The active fix spec does not carry the workflow's `verified` status

**File:** blueprint/context/current-feature.md:4
**Found:** 2026-10-07 by /audit (scope: current; lens: quality)
**Why it matters:** The status reads "implemented - offline verification
passed; awaiting review before `/complete`". Blueprint's state contract has
`/implement` set the spec to `verified` after the final gate
(`.claude/skills/implement/SKILL.md:124`). Independent-review preparation
requires an active spec "with every build step checked and status `verified`"
(audit Phase A, step 1).

This change touches the database and auth foundation, so the configured
`independentReview: when-sensitive` gate will select an independent review
before `/complete`, and that review cannot start against this status. Every
build step is checked and the fallback gates have passed, so the drift is in
the recorded state, not the work.
**Suggested fix:** Once the user accepts the recorded evidence, set
`**Status:** verified`, preferably by rerunning `/implement`'s final gate, which
owns that transition. Then approve a review checkpoint commit before
`/audit independent current`.
**Resolution:** `/implement` set the spec to `**Status:** verified` after the full fallback gate passed (typecheck, lint, 415 tests, both builds, `prisma validate`).

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..e044108): closed.** `blueprint/context/current-feature.md:4` reads `**Status:** verified`, every build step is checked, and the spec hash matches the request. This pass reran the gate commands (typecheck, lint, 415 tests, both builds, `prisma validate`, offline diff) and all pass.

### prisma-neon-auth/F-20 [P2] closed - Unrelated untracked vendor skills would be swept into the fix commit

**File:** .claude/skills/VENDOR-SOURCES.md:1
**Found:** 2026-10-07 by /audit (scope: current; lens: quality)
**Why it matters:** The working tree holds 18 untracked third-party skill
directories in each of `.claude/skills/` and `.agents/skills/`, plus two
`VENDOR-SOURCES.md` files:

- 9 from `prisma/skills`, at a pinned commit
- 9 from Neon

They are not part of the fix spec, and nobody has reviewed them as part of this
work item. `/complete` stages everything on the branch into one fix commit, so
they would land inside "Prisma ORM and Neon Managed Better Auth" with no record
of the decision to vendor them.

They are also agent instructions that load automatically into future sessions,
so what they say is a trust decision, not just repository weight. This audit
did not review their content.
**Suggested fix:** Decide explicitly before `/complete`:

- keep them out of this branch (move them aside or git-ignore them), or
- commit them separately as a reviewed `chore:` change, with `VENDOR-SOURCES.md`
  as its record.

Do not let the fix commit carry them implicitly.
**Resolution:** On 2026-10-07 the user chose to keep the vendored skills on this branch as their own commit. They landed as `68aa3ec chore: vendor Prisma and Neon agent skills` before the review checkpoint, so the fix commit does not carry them. Their content is still unreviewed third-party agent instruction.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..e044108): closed.** The vendored skills are in their own commit `68aa3ec` (192 markdown files, identical copies under `.claude/skills/` and `.agents/skills/`, plus the two `VENDOR-SOURCES.md` records), separate from the fix commit `e044108`. The original defect, silently sweeping them into the fix commit, is gone. The remaining trust question about their content is tracked separately as F-24.

### prisma-neon-auth/F-21 [P3] closed - The money conversion rule reads as `Number.isSafeInteger` on a `bigint`, which is always false

**File:** blueprint/context/coding-standards.md:177
**Found:** 2026-10-07 by /audit (scope: current; lens: quality)
**Why it matters:** The rule says to "convert money to `number` at the query
boundary only after `Number.isSafeInteger`". Architecture §4 says the same at
`dashboard-architecture.md:109`.

Prisma returns `BigInt` columns as JS `bigint`, and `Number.isSafeInteger(10n)`
is `false` (checked with Node). A literal implementation therefore rejects every
amount. It fails closed, but the contract misstates the check that keeps money
exact.
**Suggested fix:** Specify either of these checks:

- convert with `Number(value)` and require `Number.isSafeInteger` on the result
- bound-check the `bigint` against `±BigInt(Number.MAX_SAFE_INTEGER)` before
  converting

Both reject every unsafe value.
**Resolution:** Step 6 rewrote the rule in `coding-standards.md` and architecture §4: convert with `Number(value)`, reject results that fail `Number.isSafeInteger`, and never pass the `bigint` itself.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..e044108): closed.** `coding-standards.md:177-180` and `dashboard-architecture.md:109` (§4) now say to convert with `Number(value)` and reject results that fail `Number.isSafeInteger`, never passing the `bigint` itself. Correct, and no other copy of the old wording remains in the plans.

### prisma-neon-auth/F-22 [P3] closed - The architecture asserts the Neon auth SDK "never logs credentials" without evidence

**File:** blueprint/dashboard-architecture.md:333
**Found:** 2026-10-07 by /audit (scope: current; lens: security)
**Why it matters:** The §5 sketch annotates `logLevel: "warn"` with "never logs
credentials". Neon's docs describe only structured `error`/`warn` console
logging. Nothing checked what those messages contain, for example email
addresses on failed sign-in, or upstream response bodies. §29 forbids PII and
secrets in logs, and 16b could reasonably lean on this comment instead of
checking.
**Suggested fix:** Drop the claim. Instead, make it a 16b verification item:
inspect the SDK's warn/error output for failed sign-in, reset and an
unreachable Auth URL, and use `logLevel: "silent"` plus app-side logging if it
carries PII.
**Resolution:** Step 6 replaced the claim with a 16b instruction to inspect the SDK output, and added a risk entry pointing to `logLevel: "silent"` if the output carries PII.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..e044108): closed.** The §5 sketch (`dashboard-architecture.md:333`) now annotates `logLevel: "warn"` with a 16b instruction to inspect the output for PII, and the phase 2b risks (`:939`) carry the `logLevel: "silent"` fallback. The unsupported claim is gone.

### prisma-neon-auth/F-23 [P3] closed - The adapter wiring test cannot detect a duplicated `pg` copy

**File:** tests/db/index.test.ts:17
**Found:** 2026-10-07 by /audit (scope: current; lens: tests)
**Why it matters:** `PrismaPg` accepts an external pool only when
`poolOrConfig instanceof pg.Pool`
(`node_modules/@prisma/adapter-pg/dist/index.mjs:760`). Otherwise it treats the
argument as a config object and builds its own pool on connect. That pool is not
the one `attachDatabasePool` manages, so Fluid compute would stop releasing
idle connections, and nothing would error.

The test mocks `@prisma/adapter-pg`, so it proves only that the pool object was
passed. Today `npm ls pg` shows a single deduplicated `pg@8.23.1`, so there is
no defect now. A future version skew that nests a second `pg` would pass every
current test.
**Suggested fix:** Add one no-network test without the adapter mock. Build a
real `pg.Pool` (it connects lazily), call `await new PrismaPg(pool).connect()`,
assert `underlyingDriver()` returns that same pool, then `dispose()`.
**Resolution:** Step 6 added `tests/db/adapter.test.ts`: a real lazy `pg.Pool` and a real `PrismaPg`. It asserts that `underlyingDriver()` is that pool, with no network.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..e044108): closed.** `tests/db/adapter.test.ts` builds a real lazy `pg.Pool` and a real `PrismaPg`, asserts `underlyingDriver()` is that pool, then disposes and ends the pool with no network. This exercises the `instanceof pg2.Pool` branch at `node_modules/@prisma/adapter-pg/dist/index.mjs:760`, so a duplicated `pg` copy would fail it. Passes in this run; `npm ls pg` still shows one deduplicated `pg@8.23.1`.

### prisma-neon-auth/F-25 [P3] closed - Live recovery commands (`migrate status`, `migrate resolve`) are routed to the offline placeholder with no documented path

**File:** src/lib/validation/database-tooling.ts:7
**Found:** 2026-10-07 by /audit (independent; scope: current; lens: quality)
**Why it matters:** `isLiveDatabaseCommand` treats only `migrate deploy` and `studio` as live. Every other Prisma command, including `migrate status` and `migrate resolve`, receives `postgresql://offline.invalid/offline` and loads no env file. That fails closed, which is the right default, but `prisma migrate deploy` stops on a failed migration (P3009) until it is marked with `prisma migrate resolve --rolled-back|--applied`, and `migrate status` is the normal pre-flight check. With this config both fail with a DNS error against `offline.invalid`, which does not explain that the command is deliberately blocked, and the handoff in `blueprint/database-setup.md:161-190` gives no recovery procedure. The first time feature 17's migration fails on a named target, the operator has no documented approved path and may reach for an ad hoc config edit under pressure. No test pins `migrate status`/`migrate resolve` either way (`tests/lib/validation/database-tooling.test.ts:9-20`).
**Suggested fix:** Decide before feature 17 applies its first migration: either add `migrate status` and `migrate resolve` to the live set (same direct-URL requirement and separate approval), with tests, or document in `database-setup.md` that they are intentionally offline and give the approved recovery procedure.
**Resolution:** Step 7 added `migrate status` and `migrate resolve` to `isLiveDatabaseCommand` (direct URL plus separate approval). Tests now cover both, and also bare `migrate`. `database-setup.md` documents the failed-migration recovery procedure, and `AGENTS.md` lists the commands.

**Re-reviewed 2026-10-07 by /audit (independent; scope: current; lens: quality, security, performance, tests; 46af187..d060cf0): closed.** `isLiveDatabaseCommand` (`src/lib/validation/database-tooling.ts:6-16`) now treats `migrate deploy|status|resolve` and `studio` as live, so they load env files and require a valid `DATABASE_URL_UNPOOLED`; every other command, including bare `migrate`, `migrate dev`, `migrate reset`, `db push` and `migrate diff`, still gets the unroutable placeholder. Tests at `tests/lib/validation/database-tooling.test.ts:8-26` pin both sets and pass. `blueprint/database-setup.md:189-203` documents the P3009 recovery procedure with per-command approval and forbids editing `prisma.config.ts` to reach a database. No new defect introduced.

### Latest independent audit summary

Reviewed the complete `fix/prisma-neon-auth` delta
`46af187e39e1cc1137c8db1103f214274fda3234..88bf4f472ace69e4c8f3e538effdf88deffa370b`
(base ref `origin/main`, commits `68aa3ec`, `e044108`, `d060cf0`, `88bf4f4`) from
scratch across quality, security, performance and tests. Claude
`claude-opus-5-5`, automatic execution in a fresh isolated subagent. No new
finding. F-24 stays `fixed` (P3) because the upstream comparison cannot be
reproduced offline; every other entry was already closed. No P0 or P1 finding is
open or fixed. Source, tests, config and plan documents were read, including step
8's `prisma generate` build prefix and the non-production `globalThis` client
reuse in `src/db/index.ts`. The 192 vendored skill files were checked for
executable content and cross-adapter identity rather than read line by line.
Typecheck, lint, tests (21 files, 423 tests), both builds (default and empty
database variables, 19 static/SSG route entries), `prisma validate` and the
offline `migrate diff --from-empty` pass. Verdict and remaining risk are in
`blueprint/context/review.md`.

## Independent review

**Status:** passed
**Target commit:** 88bf4f472ace69e4c8f3e538effdf88deffa370b
**Base commit:** 46af187e39e1cc1137c8db1103f214274fda3234
**Base ref:** origin/main
**Spec hash:** 11160309e69b6bc93ca5ba790b118ea8e3d54d85c4caefc335076caf97f502f0
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-06T21:12:41Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-06T21:15:44Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Commands

- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm test`: pass (21 files, 423 tests)
- `npm run build`: pass (`prisma generate` ran first; 19 static/SSG route entries, no auth or dashboard endpoint)
- `env DATABASE_URL= DATABASE_URL_UNPOOLED= TEST_DATABASE_URL= npm run build`: pass (19/19 static pages)
- `npx prisma validate`: pass
- `npx prisma migrate diff --from-empty --to-schema prisma --script` (database variables unset): pass, empty migration
- `npm run preflight`: not run (unavailable in this review; the same `prisma generate` prefix is exercised by `npm run build`)
- `/check`: not run (not required)
- Live database commands (`migrate deploy`, `migrate status`, `migrate resolve`, `studio`): not run (out of scope; need separate approval)
- Upstream comparison of vendored skills: unavailable (needs network)

### Evidence

- Preconditions confirmed: `HEAD` is `88bf4f4…`, `git merge-base origin/main HEAD` is `46af187…`, the spec SHA-256 matches, and only `blueprint/context/review.md` differed from the target before this pass.
- Reviewed all four commits (`68aa3ec`, `e044108`, `d060cf0`, `88bf4f4`): `package.json`, `prisma.config.ts`, `prisma/schema.prisma`, `src/db/index.ts`, `src/lib/validation/database-tooling.ts`, `src/actions/contact.ts`, the reply-time and `PointGrid` component changes, the deleted Drizzle and auth-generator files, all changed tests, `.gitignore`, `.env.example`, `eslint.config.mjs`, `AGENTS.md` and the plan documents.
- `src/db/index.ts`: client creation stays lazy and server-only. Production keeps a module-scoped client. Outside production the client is reused through `globalThis`, and a failed creation leaves nothing cached, so the next call retries. Tests at `tests/db/index.test.ts` cover module-reload reuse and production scoping.
- `prisma.config.ts` and `isLiveDatabaseCommand`: only `migrate deploy|status|resolve` and `studio` load env files and require `DATABASE_URL_UNPOOLED`. Every other command, including argument orders that put global flags first, gets the unroutable `.invalid` placeholder and fails closed.
- `clientKey` in `src/actions/contact.ts` keys the limiter on the first non-empty forwarded element and skips the limiter when there is none. Tests cover absent, empty-leading and chained headers.
- `git grep` found no Drizzle or self-hosted Better Auth reference outside history archives, vendored skills, the spec's own problem statement, and portfolio content describing other projects.
- `src/generated/prisma` is git-ignored and lint-ignored, and no public route imports the database module.
- Vendored skills are unchanged since `d060cf0`, identical across both adapter folders, and markdown only.

### Findings

- None new
- F-24 [P3] remains `fixed`: upstream byte-identity cannot be reproduced offline. It does not block.
- No P0 or P1 finding is open or fixed

### Remaining risk

- `npm run preflight` was not run in this review. Its only change is the same `prisma generate` prefix that `npm run build` exercised.
- Step 8's "builds pass from a deleted generated folder" was not reproduced by deleting `src/generated/prisma`. Both builds regenerated the client before `next build`, which is the same path.
- Live database behaviour is unverified: no migration, connectivity, `migrate status`/`resolve` or Studio run, by design.
- Managed Better Auth SDK and service claims in the plans (beta version, `sessionDataTtl`, SMTP, 2FA roadmap, trusted domains) and Prisma's Vercel cache guidance were not checked against current upstream docs, because that needs network access.
- Upstream identity of the 18 vendored skills (F-24) needs a network fetch or an approved local clone at the pinned SHAs.
- `postinstall` runs `prisma generate`, but `prisma` is a devDependency, so an install that omits dev dependencies would fail. This does not apply on Vercel today, which installs dev dependencies. The build already needs other dev dependencies.
- `npm audit` was not re-run (network-backed). The spec records transitive dev-only advisories from the Prisma CLI.
- No browser test harness or `/check` evidence exists for the `PointGrid` and reply-time copy changes. They passed the build only.
