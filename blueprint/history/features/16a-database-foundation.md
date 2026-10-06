# Feature: Database foundation

**From build-plan:** feature 16a
**Status:** verified
**Branch:** feature/database-foundation

## Goal

Prepare the server-only Neon/PostgreSQL foundation and version-matched Better
Auth tables for owner authentication in 16b. Deliver lazy, fail-closed database
access, reproducible schema/migration tooling and reviewed initial SQL without
exposing authentication endpoints or connecting the public site to a database.
This is an offline buildable foundation; generated SQL is not an applied migration.

The approved parent split is sequential: 16a database/schema, 16b live owner
authentication and email, 16c accessible auth screens and protected dashboard
shell. Feature 16 stays unchecked until every leaf is complete. Features 17–23
remain separate. Architecture reference: `blueprint/dashboard-architecture.md`
sections 2, 4 (Better Auth tables), 6, 7, 29, 32 and 34.

## In scope

- Install only the planned database/auth-schema dependencies needed here:
  `drizzle-orm`, `pg`, `@vercel/functions`, `server-only`, `better-auth` pinned to
  an exact supported 1.6.x release; dev dependencies `drizzle-kit`, `@types/pg`.
  Use `@next/env` for Next-compatible CLI environment loading; declare it directly
  at the installed Next-compatible version if imported directly. If Better Auth
  needs a separate official schema-generator package, verify the supported tool
  and pin it to a compatible exact version before installing it. Record the
  generator and repeatable command; never use unpinned `npx ...@latest`.
- Pure Zod database-environment parsing plus lazy server-only access. Separate
  runtime `DATABASE_URL` from migration `DATABASE_URL_UNPOOLED`; include
  test-only `TEST_DATABASE_URL` in the example/documentation without making it
  mandatory for ordinary unit tests or builds.
- A lazy process-local singleton `pg.Pool` attached through
  `attachDatabasePool`, and a typed PostgreSQL Drizzle instance with snake_case
  casing and the generated auth schema. Preserve the planned pool settings
  (`max: 5`, `idleTimeoutMillis: 5000`).
- Version-matched generated `user`, `session`, `account`, `verification` and
  database-backed `rate_limit` tables; schema exports; reproducible initial
  Drizzle SQL and metadata under `drizzle/`.
- `auth:generate`, `db:generate`, `db:migrate` and `db:studio` package scripts,
  with explicit offline schema generation and separately controlled live tools.
- Database documentation and `.env.example` updates; focused tests for parsing,
  configuration redaction, lazy initialization and singleton behavior.

## Out of scope

Live Better Auth configuration, route handlers, sign-in/sign-up/session APIs,
owner registration hooks, passwords/tokens/email handling, server actions,
`requireOwner`, auth forms, dashboard layouts/pages, CSS/token changes and
portfolio copy changes belong to 16b/16c. No business tables, seed users,
Stripe/payment code, React Email, dnd-kit, Sentry, CI, browser harness or new test
runner. Existing public routes, theme, content, CSP and crawler rules stay intact.

Do not create Neon projects/branches, inspect or edit private `.env` values,
send mail, execute live queries, apply migrations, launch Studio, truncate/reset
data or deploy. Creating scripts/SQL does not authorize running their live
operations. No prototype is consumed; preserve `prototypes/`.

## Build loop

Use `feature/database-foundation`; do not implement on `main`. Approved planning
changes to build-plan/overview are part of this feature packet and must be
preserved when creating the branch. `workflow.stepReview: feature` means proceed
through passing small steps and present one implementation review packet.
`checkpointCommits: disabled`; `/complete` creates the work-level commit.

This feature handles secrets and migrations, so the configured regular
`independentReview: when-sensitive` selects automatic independent review.
After all final checks, show the exact verified checkpoint candidate and obtain
explicit commit approval, then run the project-local independent Audit workflow
in a fresh isolated reviewer. Do not self-review or waive that gate. Regular
Audit, Check and Try remain manual; implementation must still provide evidence
for the done-whens below.

## Build steps

1. [x] **Add typed, redacted configuration boundaries.** Install the necessary
   pinned packages, add a pure database-env parser and server-only lazy accessor,
   and document runtime/direct/test URLs in `.env.example`. Runtime access
   validates only its runtime URL; migration access validates only its direct
   URL. Do not require future auth/Stripe/email variables. Done when focused
   tests cover missing, blank and malformed URLs; supported PostgreSQL URI
   protocols and connection options; independent runtime/migration validation;
   and messages containing no credential or raw input. Importing server modules
   with database variables absent performs no parsing/connection and does not
   throw. No secret has a default or public export.
2. [x] **Generate auth schema and reviewed migration artifacts.** Verify the
   pinned Better Auth generator's actual configuration/CLI API against its
   official documentation and installed types. Give it a tooling-only config
   with PostgreSQL Drizzle and database-backed rate limiting, isolated from
   future live auth configuration. Generate `src/db/schema/auth.ts` and its
   exports, add `drizzle.config.ts`, scripts and initial SQL. Done when offline
   `auth:generate` followed by `db:generate` reproducibly covers exactly the five
   planned tables, adapter-compatible columns/constraints and no unrelated
   tables, and a second run produces no unexplained schema/SQL drift. Verify
   generator execution does not query a database or require real credentials.
   Review all generated code for strict TypeScript/no `any`, and all SQL for
   accidental drops, credential literals, ownership changes or seeds. Record
   the exact supported generator command/version and generation-only any
   placeholder configuration; none may be reachable through runtime access.
3. [x] **Add the lazy pool and Drizzle runtime.** Implement one typed `getDb()`
   access path using the generated schema. Create/cache the pool only on first
   valid runtime access and attach it once; no implicit localhost fallback.
   Done when focused dependency-mocked tests prove no import-time env reads or
   database calls, invalid configuration creates no pool, valid repeated access
   reuses one pool/Drizzle instance with the specified casing/settings, and
   direct/test URLs are never selected by runtime access. Use an explicit test
   seam if module caching needs isolation; no nondeterministic live network
   calls in `npm test`. Connection/query failures remain failures, with no
   fabricated success or broad exception swallowing.
4. [x] **Verify the foundation and document the handoff.** Record commands,
   generation reproducibility, env usage, unapplied migration state, intended
   Neon development/test/production separation and approved migration workflow.
   Done when `npx tsc --noEmit`, `npm run lint`, `npm test` and `npm run build`
   pass; an additional build with database variables absent still succeeds
   while retaining the existing public-origin requirement. Build output keeps
   all 11 public pages static/SSG with unchanged public routes and introduces
   no auth/dashboard endpoint. The public app imports no new runtime database
   path, so no driver/auth code or secret enters its client bundles. Provide
   the final diff and required current passing independent-review receipt
   before the final implementation handoff.
5. [x] **Repair F-18: isolate CLI startup dotenv loading.** Set the child's actual
   cwd to its temporary directory, remove inherited dotenv path/key overrides,
   and add regression coverage against the real pinned CLI using fake sentinel
   env files and intercepted reads. Done when startup/config-loader discovery
   never reads project-private files or restores removed variables, offline
   regeneration is identical, final gates pass, and F-18 is marked fixed for a
   new independent-review checkpoint. Only independent Audit may close it.

## Files / areas

- `package.json`, `package-lock.json`, `.env.example`
- New `src/lib/validation/database-env.ts`, `src/lib/env.ts`, and
  `src/types/database.ts` if shared types are needed
- New `src/db/index.ts`, `src/db/schema/auth.ts`, `src/db/schema/index.ts`
- New `drizzle.config.ts`, version-matched tooling-only auth generator config
  under `scripts/`, and generated `drizzle/` SQL/metadata
- New `tests/lib/validation/database-env.test.ts`, `tests/lib/env.test.ts`,
  `tests/db/index.test.ts`; retain the existing Vitest node configuration and
  alias conventions, adjusting a focused test mock only when required
- New `blueprint/database-setup.md` for reproducible commands and operational
  handoff; relevant database command entries in `AGENTS.md` and architecture
  sections 6/33 only if actual tooling or the approved split warrants precision
- Approved `blueprint/build-plan.md`, regenerated
  `blueprint/context/project-overview.md`, and this current spec

These paths are implementation areas, not permission to change unrelated code.
Do not add empty future business-schema or relation modules for scaffolding.

## Data / contracts

- Runtime is Node.js PostgreSQL through `pg`, not an HTTP driver or Edge runtime.
  The planned Neon region is `aws-ap-southeast-2`, adjacent Vercel `syd1`.
  Actual provider setup is unverified and remains an operational handoff.
- URLs are nonempty PostgreSQL connection URIs (`postgres:` or `postgresql:`)
  with a host and database name. Preserve encoded credentials and connection
  query options; do not rewrite user/password/database/SSL settings or log URI
  values. Neon documentation/examples retain required TLS options. Do not
  hardcode a Neon hostname requirement that prevents local PostgreSQL tooling.
- Runtime reads `DATABASE_URL`; Drizzle migration/Studio tools require the
  explicit direct `DATABASE_URL_UNPOOLED`. No fallback between them. A missing
  migration URL produces a sanitized configuration failure before a live tool
  starts. Offline schema generation must work without real URLs, with any
  tooling-only stand-in isolated from migration/Studio and runtime code paths.
  Do not introduce usable default credentials for live commands.
- Pure validation takes supplied values for deterministic tests; only the
  server-only lazy wrapper reads `process.env`. Use the installed Zod 3.25 API.
  Exceptions may identify the missing/invalid variable, never its value or
  provider text. Invalid config fails closed on first use. Do not reuse the
  public origin parser for secrets because its error messages include inputs.
- Connection initialization is lazy. The architecture's module-level singleton
  describes lifecycle, not permission for eager config validation/pool creation.
  Cache one pool and typed Drizzle instance after validation on first access;
  retain `max: 5`, `idleTimeoutMillis: 5000`, `attachDatabasePool`, snake_case.
  Do not swallow driver errors or enable disabled certificate checks.
- Better Auth owns its schema. IDs are library-generated `text`, not business
  UUIDs; no custom password/hash/token implementation or separate owner profile.
  `user.email` is unique; `session.token` is unique. Session/account user foreign
  keys cascade on user deletion. Account includes the library's credential/token
  fields; verification includes identifier/value/expiry; rate limit has its
  library ID, unique key, integer count and bigint last-request value. Keep
  adapter property mappings and database names compatible with the pinned
  generator. Future plugins such as two-factor are absent.
- Review timestamp definitions against architecture's `timestamptz` and
  created/updated defaults. If generator defaults differ, preserve library
  compatibility while explicitly documenting/regenerating the necessary
  schema adjustments rather than silently changing the storage contract.
  Generation must preserve all required columns, defaults, nullability,
  constraints and indexes, not a hand-written approximation of five tables.
- Schema exports are safe for offline CLI consumption and contain no secret
  reads or live connection initialization. Runtime DB/env entry points use
  `import "server-only"`; CLI-only configuration must not accidentally import
  the server-only runtime when ordinary Node conditions would reject it.
- Drizzle: PostgreSQL dialect, `schema: "./src/db/schema"`, `out: "./drizzle"`,
  snake_case casing, strict/verbose generation as planned. Load CLI environment
  with Next's `loadEnvConfig` before validation; honor the same `.env`/`.env.local`
  precedence. Commit SQL and metadata; never run migration in build/install.
- No registration/API/session exists yet. Owner identity, normalization, atomic
  registration enforcement, session authorization and auth limits are specified
  and tested in 16b before any endpoint is exposed. This schema work grants no
  user or client access. No seeds, external state changes or data reads occur here.

## Testing

- `npm test` is the existing Vitest unit gate; no integration/browser runner is
  installed by this leaf. Mirror `src/` under `tests/` and import via `@/`.
  Mock `server-only`/pool attachment and driver construction as needed to test
  lifecycle seams without connecting; do not mirror irrelevant layout markup.
- Parser tests include absent/whitespace/invalid protocol/host/database,
  encoded credentials and query options, separate runtime/direct configuration,
  and explicit proof that errors expose no supplied URI/password.
- Runtime tests assert no work at import, validation before initialization,
  correct pool options, one attachment/instance across calls, runtime URL
  selection, and propagation of unexpected failures. No test mutates shared DBs.
- CLI evidence: exact versioned offline auth generation, SQL generation,
  reviewed five-table migration, repeatability, and fail-closed missing direct
  URL for live tooling. Do not run `db:migrate`/`db:studio` just to test denial.
  Test their configuration path without making a network connection.
- Final `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`; no
  combined Verify command exists. Build without DB variables too, without
  changing `.env` or exposing other environment values. Public origin validation
  remains unchanged. Build output is evidence of static generation, not live
  database connectivity, successful migrations or authenticated behavior.
- No new UI is present, so no screenshot/visual replication gate applies. Reuse
  existing public-browser evidence if unchanged; do not install a browser harness
  or start a dev server. Any live verification required by new evidence needs a
  user-started server and separately authorized target-specific DB operations.
- Sensitive schema/config changes require the configured independent review
  after an approved immutable checkpoint. Only then is `/complete` available.

## Notes for the AI

Strict TypeScript and no `any`, including generated schema/config/tests. No new
Tailwind config or theme change. Verify exact third-party APIs using official
documentation and installed types during implementation; architecture snippets
are intent, not guaranteed current SDK signatures. Do not upgrade Next/React/
Zod or install dependencies for later leaves. The user explicitly approved
switching the existing runner to Vitest 4 to satisfy Better Auth's peer range;
retain the existing test suite, node environment and test command.

Planning baseline: the repository had no `src/db/`, database-env module, Drizzle
config/scripts, Better Auth dependency or migration files; Resend is only used
in the existing contact action. Vitest node tests exist; no Verify or Browser
tests command exists. No implementation checks, generated SQL, real database
queries or credential/provider readiness checks ran while writing this spec.

Resend readiness and live owner registration remain prerequisites for 16b,
not reasons to pull email work into 16a. Prepare a named-target migration
handoff, then stop before applying it. Avoid committing or pushing plan/spec
changes from this planning skill; stop for user review and `/implement`.

## Dependency decision

- Work branch `feature/database-foundation` was created before implementation.
- Registry metadata for Better Auth 1.6.0, 1.6.10 and 1.6.33 declares optional
  Vitest peers `^2.0.0 || ^3.0.0 || ^4.0.0`, excluding the existing Vitest 5.
- Normal installation of the exact planned runtime packages failed with npm
  `ERESOLVE` for `better-auth@1.6.33` versus the project's `vitest@^5.0.0`.
  No `--force`/`--legacy-peer-deps` or manifest overrides were applied.
- Resolved by the user: "use vitest 4 and implement all steps". Pin Vitest
  4.1.11 with the existing tests/configuration; use normal npm resolution without
  peer overrides or force flags. Pin Better Auth and its official `auth` CLI to
  1.6.33. Run all existing tests and final verification after the dependency change.

## Initial checkpoint evidence — 2026-10-06

- The original four implementation steps passed on `feature/database-foundation`
  before checkpoint `9809441`. Independent review subsequently found F-18;
  its repair and remaining gate are recorded below.
- Runtime versions: Better Auth 1.6.33, Drizzle ORM 0.45.3, pg 8.23.1,
  @vercel/functions 3.9.11, server-only 0.0.1, @next/env 16.3.4. Tooling:
  auth CLI 1.6.33, Drizzle Kit 0.31.11, @types/pg 8.23.1, Vitest 4.1.11.
  Lockfile comparison confirms Vitest is the only existing direct dependency
  whose resolved version changed; no Next/React/Zod upgrade or peer override.
- Focused tests: six files, **47 passing tests**. Full `npm test`: **22 files,
  420 passing tests**, including the existing suite under Vitest 4.
- `npx tsc --noEmit` and `npm run lint` both exit 0.
- `npm run auth:generate` then `npm run db:generate` both exit 0. Repeat runs
  report no schema changes; SHA-256 checks confirm identical auth schema,
  initial SQL, snapshot and journal. F-18 invalidated the initial claim that the
  CLI's dotenv startup was isolated; repair evidence is below. Node 24.11.1 reports a
  harmless module-type detection warning for the shared TypeScript helper.
- Reviewed `drizzle/0000_moaning_morlocks.sql`: exactly five auth tables,
  unique constraints, cascade user foreign keys, indexes and timezone-aware
  lifecycle defaults. No drops, seeds or credential literals. No SQL applied.
- `npm run build` and `env DATABASE_URL= DATABASE_URL_UNPOOLED=
  TEST_DATABASE_URL= npm run build` both exit 0. Explicit empty values prevent
  dotenv fallback without modifying private configuration. Both retain the
  same 11 public pages as static/SSG, with no auth/dashboard endpoint. Public
  origin validation is unchanged.
- Source import review finds no database/auth runtime dependency in public
  app/components/actions/content. Client chunk scan finds no new DB runtime,
  configuration or auth/driver markers. Strict-code scan finds no `any` or
  disabled TLS checks in the new source/tooling/schema. `git diff --check` passes.
- `blueprint/database-setup.md`, `.env.example`, command entries and architecture
  document the offline/live boundary, timestamp/default normalization, named
  Neon targets and separate migration approval. No private env values were
  displayed or edited. F-18 identified unintended CLI startup dotenv loading.
  No live query, migration, Studio session, provider setup or server start occurred.
- Install output reported 22 dependency audit notices (11 moderate, 10 high,
  1 critical). They have not been attributed to baseline versus additions or
  assessed through a dependency audit; no broad audit fix was applied. Regular
  Audit/Check/Try remain manual per configuration. Prior P2/P3 findings remain
  outside this leaf's scope; F-18 is the current P1 and requires re-review.

## F-18 repair evidence — 2026-10-06

- Approved original checkpoint committed as `9809441`; its automatic independent
  Codex/gpt-6-astra receipt requests changes for F-18. No merge or push occurred.
- Actual child-process cwd now matches the temporary CLI discovery directory.
  `DOTENV_CONFIG_*`, `DOTENV_KEY` and runtime/direct/test/auth variables are
  removed before the CLI starts; absolute executable/config/output paths remain.
- `tests/scripts/generate-auth-schema.test.ts` executes the real pinned CLI in
  a disposable fixture, with fake dotenv sentinels and inherited path/vault-key
  overrides. A preload intercepts attempted dotenv reads before opening files.
  Every read stays inside the temporary child cwd; stripped variables and
  overrides remain absent; generated schema matches the committed artifact.
  Tests do not rewrite product schema or read private app configuration.
- Focused regression passes. Full `npm test`: **23 files, 421 tests pass**.
  `npx tsc --noEmit` and `npm run lint` pass. Offline auth/SQL regeneration
  passes and SHA-256 checks confirm unchanged schema/SQL/snapshot/journal.
- Default `npm run build` after repair is unavailable: Turbopack's CSS worker
  cannot bind its socket (`Operation not permitted`) even with escalation.
  The independent reviewer encountered the same environment restriction.
  `npm run build -- --webpack` and `env DATABASE_URL= DATABASE_URL_UNPOOLED=
  TEST_DATABASE_URL= npm run build -- --webpack` both pass with the same
  static/SSG public routes; this is supporting evidence and does not waive
  the default build gate.
- The user supplied successful local output for both `npm run build` and
  `env DATABASE_URL= DATABASE_URL_UNPOOLED= TEST_DATABASE_URL= npm run build`
  after the repair. Both Turbopack runs generate all 19 static artifacts and
  retain the same 11 public pages as static/SSG, with no auth/dashboard route.
  This satisfies the default build gate using user-provided local evidence;
  the isolated review environment's socket restriction remains documented.
- F-18 is marked `fixed` after the regression, not closed or accepted. The
  fifth implementation step now passes. A new exact checkpoint requires explicit
  approval and full independent review before `/complete`; no repair commit
  exists yet. The prior receipt remains changes-requested for the original SHA.

## Completion verification

- Final `npx tsc --noEmit --incremental false`, `npm run lint` and `npm test` pass; 23 test files, 421 tests.
- Final `npm run build` and `env DATABASE_URL= DATABASE_URL_UNPOOLED= TEST_DATABASE_URL= npm run build` both pass in the builder during Complete; all 11 public pages remain static/SSG. The previous socket restriction did not recur in this final pass.
- Independent receipt validated against the exact checkpoint, main merge base and unchanged spec bytes before archival. F-18 is closed; prior unresolved findings remain in the live ledger.
- SQL remains unapplied. No live operations or network dependency audit was performed.

## Findings

### 16a/F-18 [P1] closed - Offline auth generation still loads the project dotenv file at CLI startup

**File:** scripts/generate-auth-schema.mjs:20
**Found:** 2026-10-06 by /audit (independent; scope: current; lens: security, tests)
**Why it matters:** The wrapper deletes database/auth variables from the child
process environment and passes `--cwd <temporary directory>`, but its
`spawnSync` options omit `cwd`. The child therefore starts in the project root.
The pinned `auth@1.6.33` CLI imports `dotenv/config` at module initialization
(`node_modules/auth/dist/index.mjs:34`), before Commander parses `--cwd`.
The resolved dotenv implementation reads `process.cwd()/.env`, so the CLI
still reads the private project file and can restore the stripped credentials.
This violates the spec's offline/no-private-env generation boundary and the
claim in `blueprint/database-setup.md:53`. No database connection or external
secret disclosure was observed or is claimed.

**Evidence:** A local, in-memory probe resolved `dotenv/config` from the actual
CLI entry point, replaced `fs.readFileSync` with a guard that throws before any
`.env*` read, then imported that module. Its only reported dotenv read attempt
was `project-root/.env`; no private file contents were read or printed. Static
review confirms the wrapper's child inherits that same root cwd. The current
normalizer tests never exercise the wrapper's process or dotenv boundary.

**Suggested fix:** Set the actual child-process `cwd` to the temporary directory
while retaining absolute CLI/config/output paths. Remove or constrain inherited
`DOTENV_CONFIG_PATH` (and other dotenv path overrides) so it cannot redirect the
startup import back to private files. Add a regression test with fake dotenv
sentinels or intercepted reads proving both startup dotenv and config-loader
discovery remain isolated and no credential is restored. Re-run the offline
generation/repeatability checks and update the evidence before a new checkpoint.
**Resolution:** Repaired 2026-10-06 through `/implement`. The wrapper now sets
the actual child cwd to its temporary directory and removes inherited
`DOTENV_CONFIG_*`/`DOTENV_KEY` alongside database/auth variables. A regression
test runs the real pinned CLI in a disposable fixture with fake `.env` and
`.env.local` sentinels and inherited path/key overrides. Intercepted reads
remain inside the child's temporary cwd; stripped variables/overrides are
absent at exit; generated schema matches the committed artifact. The focused
test and full 421-test suite, typecheck, lint and offline regeneration/hash
checks pass. The user supplied successful local output for both default
Turbopack builds after repair, including the empty-database-variable build;
public routes retain static/SSG output. Status is
`fixed`, not `closed`; a new independent checkpoint/review must confirm it.


**Re-reviewed 2026-10-06 by /audit (independent; scope: current; all four
lenses; dad3bdf..5acabcd): closed.** This fresh reviewer inspected the complete
feature delta, including the wrapper, CLI configuration, normalizer, generated
schema and the real-CLI regression. `spawnSync` now sets the actual temporary
cwd, while CLI/config/output paths remain absolute. The wrapper removes all
`DOTENV_CONFIG_*` keys and `DOTENV_KEY` before startup. The passing regression
executes the pinned CLI, records dotenv attempts before reads, confirms every
attempt stays under the temporary cwd, checks that stripped variables and
overrides remain absent, and compares generated schema with the committed
artifact. The complete 421-test suite, nonincremental typecheck and lint pass.
The original startup-discovery defect is gone and no new defect was found in
its repair. No private env content or live database was accessed by this review.


## Independent review

**Status:** passed
**Target commit:** 5acabcdcad57cf704e190ebc067ec674c2bcaf8a
**Base commit:** dad3bdf805e589a2cdc4bf9187d21b901c29140a
**Base ref:** main
**Spec hash:** a489d95e96b29d427b25d20d6ccf2dc0a7852efe61ba659c53d73f4ae2ea4235
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6-astra
**Requested execution:** automatic
**Requested at:** 2026-10-06T00:57:19.750Z
**Workflow:** regular
**Check required:** no

**Reviewer adapter:** codex
**Reviewer model:** gpt-6-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-06T01:00:29.462465Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git status --short`, `git rev-parse HEAD`, `git merge-base main HEAD`,
  `shasum -a 256 blueprint/context/current-feature.md`: pass; exact target,
  permitted base, spec hash and worktree confirmed before and after review.
- `npm test`: pass; 23 files, 421 tests, including the real pinned CLI regression.
- `npx tsc --noEmit --incremental false`: pass; no type errors and no incremental
  cache write needed for the review.
- `npm run lint`: pass.
- `git diff --check main...HEAD`: pass.
- Read-only Node lockfile comparison: pass; manifest/lock root match, Vitest is
  the only existing direct dependency whose resolved version changed, and all
  resolved package sources are the npm registry. This is not a vulnerability scan.
- Read-only Node schema/snapshot comparison: pass; exactly the five expected
  tables, with matching column counts, SQL types, nullability and primary keys.
- Targeted `rg` import, unsafe-config, strict-type and test-modifier searches:
  no new DB/auth runtime imports in public app/components/actions/content, no
  explicit `any` or disabled TLS checks, and no skipped/focused/placeholder
  tests in the new feature tests.

## Evidence

- Reviewed the complete `dad3bdf805e589a2cdc4bf9187d21b901c29140a..5acabcdcad57cf704e190ebc067ec674c2bcaf8a`
  delta across all four lenses, not only F-18. Coverage includes all 29 changed
  code/config/documentation paths: `.env.example`, AGENTS command changes,
  package manifest/lock, Drizzle config/SQL/snapshot/journal, both generator
  scripts, all new DB/env/validation/normalizer modules, all seven new test
  files, active spec, build-plan, overview, architecture and database setup.
  Request/findings are excluded from code scope. Unchanged unrelated source,
  generated build output, private environment files and third-party internals
  are excluded except the targeted installed CLI/pool APIs needed to verify
  the feature contracts.
- Checked local standards for strict TypeScript, server-only lazy initialization,
  redacted validation, separate runtime/direct/test configuration, no migration
  during build/install, bounded pool size and logic-test coverage. Public route,
  UI and content source files have no feature changes.
- The pool initializes only after runtime validation, attaches once and caches
  the typed Drizzle object. Tests cover import laziness, validation-before-pool,
  reuse, exact options/casing and propagation of initialization/query failures.
  No auth instance, endpoint or user-facing database path is exposed in 16a.
- Inspected the installed `auth@1.6.33` configuration loader/generator and
  `@vercel/functions` pool attachment implementation. CLI adapter/dialect flags
  generate without a database instance; telemetry is disabled. The F-18 test
  runs the actual CLI in a disposable fixture, intercepts dotenv reads and
  validates that generation matches the committed schema.
- Reviewed all SQL and migration metadata: only five auth tables, text IDs,
  unique email/session token/rate key, cascading user foreign keys, supporting
  indexes and timezone-aware lifecycle defaults. No drops, seeds, credentials
  or ownership changes. Schema normalization preserves adapter properties and
  rejects unexpected table/date syntax.
- The verified spec records successful offline auth/SQL regeneration and repeat
  hashes after repair. This child independently regenerated auth schema through
  the passing disposable-fixture regression; it did not run root generation
  commands that can rewrite the immutable checkpoint's artifacts.
- The verified spec records user-provided successful local `npm run build` and
  `env DATABASE_URL= DATABASE_URL_UNPOOLED= TEST_DATABASE_URL= npm run build`
  after repair: 19 static artifacts, the same 11 public pages as static/SSG,
  no auth/dashboard routes. This is accepted as user-provided build evidence,
  not represented as this child's execution. It also records supporting
  webpack builds and the isolated environment's Turbopack socket restriction.

## Findings

- F-18 [P1]: closed after complete repair review and passing real-CLI regression.
- No new findings in quality, security, performance or tests. No P0/P1 finding
  remains open or fixed. Carried F-07, F-08, F-15, F-16 and F-17 retain their
  prior statuses; unrelated public-site findings were not silently accepted.

## Remaining risk

- `npm run build` and the empty-database-variable default build were unavailable
  to reproduce in the recorded isolated environment because Turbopack's CSS
  worker cannot bind its socket. They were not retried in this child; the
  successful user-provided post-repair local evidence in the exact verified
  spec supports the gate. No browser/transfer-size measurement was performed.
- Root `npm run auth:generate` and `npm run db:generate` were not rerun by this
  child because they can rewrite product artifacts. Auth reproducibility was
  independently exercised in the fixture; SQL repeatability relies on the
  spec's builder evidence plus static SQL/schema/snapshot review.
- No live database, migration, Studio, provider readiness, auth flow or database
  performance check was run. SQL remains unapplied. Those operations require
  the later named-target approval and authentication implementation.
- No network-backed dependency audit ran. The spec reports 22 installation
  audit notices (11 moderate, 10 high, 1 critical) without attribution to this
  delta or reachability analysis. Their impact remains unverified; manifest
  inspection does not clear them. No existing local security/performance or
  browser-test command is declared; Check was not required.
