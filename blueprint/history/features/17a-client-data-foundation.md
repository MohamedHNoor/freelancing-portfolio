# Feature: Client data foundation

**From build-plan:** feature 17a

**Branch:** feature/client-data-foundation

**Status:** verified

## Goal

Give the dashboard its first persisted data: owner-scoped clients with their
default currency and billing details, an append-only activity log written in the
same transaction as every client change, exact integer money helpers that
feature 18 builds on, and the client Server Actions that 17b's screens will
call. Prove ownership isolation against a real local Postgres database.

## In scope

- `prisma.config.ts` and `prisma/schema.prisma` changes for the external
  `neon_auth.user` table, exactly as `blueprint/database-setup.md` (Schema
  layout) prescribes
- Prisma models: `enums`, `neon-auth` (read-only `NeonAuthUser`), `clients`,
  `activities`
- The first migration, authored offline with `prisma migrate diff --from-empty`,
  plus `migration_lock.toml`
- `src/lib/money.ts`: currency table, string-based parsing, server-side
  formatting, and the `bigint` query-boundary conversion
- Zod schemas: `src/lib/validation/money.ts`, `client.ts`, `activity.ts`
- `src/lib/permissions.ts` (`NotFoundError`, `ConflictError`, `ownedClient`)
- Services: `src/server/services/activity.ts`, `src/server/services/clients.ts`
- Queries: `src/server/queries/clients.ts`, `src/server/queries/activity.ts`
- `src/server/owner-action.ts` and `src/actions/clients.ts` (`createClient`,
  `updateClient`, `archiveClient`)
- `NOT_FOUND` and `CONFLICT` action error codes
- A local Postgres integration harness (`npm run test:integration`) with two
  seeded owners
- Documentation: `blueprint/database-setup.md`, the Commands section of
  `AGENTS.md`, `.env.example`

## Out of scope

- Every screen, navigation change, form component, and the overview copy (17b)
- Applying the migration to any Neon branch (17b, separate approval)
- `deleteClient`, unarchiving, search, and pagination (not in the build plan)
- Projects, milestones, payment requests and their activity columns, foreign keys
  and `activity_type` values (features 18 to 21 add them)
- Stripe customers and the lazy Stripe re-sync; `stripe_customer_id` is created
  as a nullable column only (feature 20)
- Plan allocation (`allocate`) and finance derivations (feature 18 onward)
- Any Neon, Vercel, or remote change

## Build loop

`workflow.stepReview` is `feature`: build every step below, keeping each one
working, then present one review packet for the whole feature.
`workflow.checkpointCommits` is `disabled`: no commits between steps. `/complete`
creates the final feature commit.

This feature adds auth-scoped persistence, so `qualityGates.regular.independentReview:
when-sensitive` selects an independent review before `/complete`.

## Build steps

- [x] **1. External auth table, models, and the first migration**
  - `prisma.config.ts`: add `experimental: { externalTables: true }`,
    `tables: { external: ["neon_auth.user"] }`, and `migrations.initShadowDb`
    (SQL creating `neon_auth.user (id uuid primary key)`). Keep the existing
    live/offline datasource split untouched.
  - `prisma/schema.prisma`: `schemas = ["public", "neon_auth"]` on the
    datasource.
  - `prisma/models/enums.prisma`: `Currency` (`ZAR NZD AUD USD GBP`,
    `@@map("currency")`), `ActivityActor` (`owner client stripe system`),
    `ActivityType` (`client_created client_updated client_archived` only).
    Every enum and model carries `@@schema("public")` except `NeonAuthUser`.
  - `prisma/models/neon-auth.prisma`: `NeonAuthUser` with only `id` (`@db.Uuid`),
    `@@map("user")`, `@@schema("neon_auth")`.
  - `prisma/models/clients.prisma` and `activities.prisma`: columns, types,
    defaults, foreign keys and indexes exactly as in Data / contracts.
  - `prisma/migrations/<YYYYMMDDHHMMSS>_clients_and_activities/migration.sql`
    from `npx prisma migrate diff --from-empty --to-schema prisma --script -o ...`,
    plus `prisma/migrations/migration_lock.toml` (`provider = "postgresql"`).
  - **Done when:** `npx prisma validate` and `npm run db:generate` pass offline;
    the SQL creates only `public` objects, references
    `"neon_auth"."user"("id") ON DELETE RESTRICT`, and contains no `neon_auth`
    DDL; `npx tsc --noEmit`, `npm test` and `npm run build` pass (existing
    `database-tooling` tests stay green).

- [x] **2. Integer money and shared validation**
  - `src/lib/money.ts` (pure, no `server-only`, since feature 18's schemas reuse
    the parser): `CURRENCIES`, `CURRENCY_EXPONENT` (all 2), `CURRENCY_LOCALE`
    (`ZAR en-ZA`, `NZD en-NZ`, `AUD en-AU`, `USD en-US`, `GBP en-GB`),
    `parseMoney(input, currency)`, `formatMoney(minor, currency)`,
    `minorFromDb(value: bigint)`, `minorToDb(minor: number)`.
  - `src/lib/validation/money.ts`: `currencySchema`, `moneyInputSchema`
    (string to minor units, `> 0`, safe integer), `idSchema` (uuid).
  - **Done when:** `tests/lib/money.test.ts` and
    `tests/lib/validation/money.test.ts` cover the cases under Testing and
    `npm test` passes.

- [x] **3. Client and activity schemas**
  - `src/lib/validation/client.ts`: `clientInputSchema` with the field rules in
    Data / contracts; export `ClientInput = z.input`, `ClientValues = z.output`,
    and `CLIENT_FIELDS` (the ordered list of editable field keys).
  - `src/lib/validation/activity.ts`: a discriminated union on `type` for the
    three client activity payloads.
  - **Done when:** `tests/lib/validation/client.test.ts` and
    `tests/lib/validation/activity.test.ts` pass under `npm test`.

- [x] **4. Local Postgres integration harness**
  - `vitest.integration.config.mts`: same alias and inline settings as
    `vitest.config.mts`, `include: ["tests/integration/**/*.test.ts"]`,
    `fileParallelism: false`, a `globalSetup`, and a `setupFiles` entry.
  - `vitest.config.mts`: exclude `tests/integration/**` so `npm test` never needs
    a database.
  - `package.json`: `"test:integration": "vitest run --config vitest.integration.config.mts"`.
  - `tests/integration/support/`: load env with `loadEnvConfig` (as
    `prisma.config.ts` does), validate `TEST_DATABASE_URL` with
    `parseDatabaseUrl`, and **refuse to run** unless its host is `localhost`,
    `127.0.0.1` or `::1` and its database name ends in `_test`. Only then: drop
    and recreate the `public` and `neon_auth` schemas, create the
    `neon_auth.user (id uuid primary key)` stub, apply every committed
    `prisma/migrations/*/migration.sql` in name order, and insert two fixed owner
    ids. The setup file points `DATABASE_URL` at the test URL before `@/db` is
    imported. A helper truncates `activities` and `clients` between tests.
  - The user creates the local database (`createdb portfolio_test` on the
    installed Homebrew Postgres) and sets `TEST_DATABASE_URL` in `.env.local`;
    the agent asks before running either.
  - A smoke test (`tests/integration/db/migrations.test.ts`) asserts both tables
    exist and both owners are seeded.
  - **Done when:** `npm run test:integration` passes locally; with
    `TEST_DATABASE_URL` pointed at a non-local host or a name without `_test` it
    exits non-zero before connecting, and the message names only the variable;
    `npm test` still passes with no database.

- [x] **5. Ownership, activity, client services, and queries**
  - `src/lib/permissions.ts` (`server-only`): `NotFoundError`, `ConflictError`,
    and `ownedClient(tx, ownerId, clientId, { forUpdate? })`. With `forUpdate`,
    it first locks through a tagged
    `$queryRaw` `SELECT id FROM clients WHERE id = ... AND owner_id = ... FOR UPDATE`,
    then reads the row. A missing row and another owner's row both throw
    `NotFoundError`.
  - `src/server/services/activity.ts`: `recordActivity(tx, entry)`, which parses
    `data` with the activity schema and inserts. It is the only write path; no
    update or delete function exists.
  - `src/server/services/clients.ts`: `createClient`, `updateClient`,
    `archiveClient`, each in one `getDb().$transaction`, with the activity insert
    inside the same transaction (rules in Data / contracts).
  - `src/server/queries/clients.ts`: `listClients(ownerId, { archived })`,
    `getClient(ownerId, clientId)`. `src/server/queries/activity.ts`:
    `listClientActivity(ownerId, clientId)`.
  - Integration tests in `tests/integration/server/services/clients.test.ts` and
    `tests/integration/server/queries/clients.test.ts`.
  - **Done when:** `npm run test:integration` proves every case under Testing,
    including owner B receiving `NotFoundError` from each service and query that
    loads a record.

- [x] **6. Client Server Actions**
  - `src/types/action.ts`: add `NOT_FOUND` and `CONFLICT`; add their messages to
    the exhaustive `MESSAGES` record in `src/actions/auth.ts` unchanged
    otherwise.
  - `src/server/owner-action.ts` (`server-only`, outside `src/actions` so it is
    never exposed as an action): `ownerAction(schema, handler)` runs
    `requireOwnerForAction` first, then `safeParse`, then the handler in
    try/catch, mapping errors as in Data / contracts.
  - `src/actions/clients.ts` (`"use server"`): `createClient(raw)`,
    `updateClient(clientId, raw)`, `archiveClient(clientId)`, each calling
    `revalidatePath("/dashboard/clients")`, plus the client's detail path once
    an id is known, after a successful commit.
  - `tests/actions/clients.test.ts` with the session, services and `next/cache`
    mocked.
  - **Done when:** the action tests pass under `npm test`, and
    `tests/actions/auth.test.ts` still passes.

- [x] **7. Documentation and final gate**
  - `blueprint/database-setup.md`: the first migration now exists (what it
    contains and that no Neon branch has it yet), the external-table
    configuration as built, and the local integration harness with its guard.
  - `AGENTS.md` Commands: `Integration tests: npm run test:integration` (local
    Postgres only, requires `TEST_DATABASE_URL`).
  - `.env.example`: replace the "Reserved" comment on `TEST_DATABASE_URL` with
    the local, `_test`-suffixed rule.
  - **Done when:** `npx tsc --noEmit`, `npm run lint`, `npm test`,
    `npm run test:integration`, `npm run build`, and
    `env DATABASE_URL= DATABASE_URL_UNPOOLED= TEST_DATABASE_URL= npm run build`
    all pass, with every public route still static.

## Files / areas

- `prisma.config.ts`, `prisma/schema.prisma`, `prisma/models/*.prisma`,
  `prisma/migrations/**`
- `src/lib/money.ts`, `src/lib/permissions.ts`
- `src/lib/validation/money.ts`, `client.ts`, `activity.ts`
- `src/server/services/activity.ts`, `src/server/services/clients.ts`
- `src/server/queries/clients.ts`, `src/server/queries/activity.ts`
- `src/server/owner-action.ts`, `src/actions/clients.ts`, `src/actions/auth.ts`
  (messages only), `src/types/action.ts`
- `vitest.config.mts`, `vitest.integration.config.mts`, `package.json`
- `tests/lib/money.test.ts`, `tests/lib/validation/{money,client,activity}.test.ts`,
  `tests/actions/clients.test.ts`, `tests/integration/**`
- `blueprint/database-setup.md`, `AGENTS.md`, `.env.example`

## Data / contracts

**Conventions** (architecture §4): uuid primary keys with
`@default(dbgenerated("gen_random_uuid()")) @db.Uuid`; snake_case through
`@map`/`@@map`; `created_at`/`updated_at` `timestamptz NOT NULL DEFAULT now()`,
`updated_at` also `@updatedAt`.

**`clients`**

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| owner_id | uuid | NOT NULL, FK `neon_auth.user(id)` ON DELETE RESTRICT |
| name | text | NOT NULL, contact person |
| email | text | NOT NULL, stored lowercased, not unique |
| phone, company_name | text | NULL |
| country_code | char(2) | NULL, uppercase ISO 3166-1 alpha-2 shape |
| default_currency | currency | NOT NULL |
| address_line1, address_line2, city, region, postal_code | text | NULL |
| notes | text | NULL |
| stripe_customer_id | text | NULL, UNIQUE, unused until feature 20 |
| archived_at | timestamptz | NULL, soft delete |
| created_at, updated_at | timestamptz | |

Indexes: `(owner_id, archived_at)`, `(owner_id, name)`.

**`activities`** (append-only)

| Column | Type | Rule |
|---|---|---|
| id | uuid | PK |
| owner_id | uuid | NOT NULL, FK `neon_auth.user(id)` ON DELETE RESTRICT |
| client_id | uuid | NULL, FK `clients(id)` ON DELETE SET NULL |
| type | activity_type | NOT NULL |
| actor | activity_actor | NOT NULL |
| summary | text | NOT NULL, rendered at write time |
| data | jsonb | NOT NULL DEFAULT `'{}'` |
| occurred_at | timestamptz | NOT NULL DEFAULT now() |

Index: `(owner_id, occurred_at DESC)`. `project_id`, `milestone_id`, `task_id`
and `payment_request_id` arrive with their tables. No `updated_at`: rows never
change.

**`clientInputSchema`** (one schema for the 17b form and these actions). Every
string is trimmed; an empty optional field becomes `null` in the output.

| Field | Rule | Error message |
|---|---|---|
| name | required, 1-120 | "Enter the contact's name." / "Use at most 120 characters." |
| email | required, lowercased, ≤ 254, email | "Enter a valid email address." |
| phone | optional, ≤ 40 | "Use at most 40 characters." |
| companyName | optional, ≤ 160 | "Use at most 160 characters." |
| countryCode | optional, uppercased, `^[A-Z]{2}$` | "Use a two-letter country code, such as NZ." |
| defaultCurrency | required, one of the five | "Choose a currency." |
| addressLine1, addressLine2 | optional, ≤ 200 | "Use at most 200 characters." |
| city, region | optional, ≤ 100 | "Use at most 100 characters." |
| postalCode | optional, ≤ 20 | "Use at most 20 characters." |
| notes | optional, ≤ 5000 | "Use at most 5,000 characters." |

There is no default currency; the owner chooses one.

**Activity payloads** (`src/lib/validation/activity.ts`), actor always `owner`
in this feature. The display name is `companyName ?? name`.

| type | data | summary |
|---|---|---|
| `client_created` | `{}` | `Created client {display}` |
| `client_updated` | `{ changedFields: ClientField[] }`, non-empty, field keys only, never values | `Updated client {display}` |
| `client_archived` | `{}` | `Archived client {display}` |

**Service rules**

- `createClient(ownerId, values)` inserts the client and `client_created` in one
  transaction and returns `{ id }`.
- `updateClient(ownerId, clientId, values)` locks with `ownedClient(..., { forUpdate: true })`.
  Archived: `ConflictError`. No field differs from the stored value: no write,
  no activity, returns `{ id }`. Otherwise updates and writes `client_updated`
  with the changed keys in `CLIENT_FIELDS` order.
- `archiveClient(ownerId, clientId)` runs
  `updateMany({ where: { id, ownerId, archivedAt: null } })`. One row: write
  `client_archived`. Zero rows: `ownedClient` decides between `NotFoundError`
  and an already-archived client, which returns success with no second activity.
  Returns `{ id }`.
- Services take the owner id only from the caller, which takes it only from the
  session. No service accepts an owner id from browser input.

**Queries**

- `listClients(ownerId, { archived: boolean })`: active (`archived_at IS NULL`)
  or archived clients only, ordered by `name` then `id`, returning `id, name,
  companyName, email, countryCode, defaultCurrency, archivedAt`.
- `getClient(ownerId, clientId)`: the full client row, or `NotFoundError`.
- `listClientActivity(ownerId, clientId)`: proves ownership with `ownedClient`,
  then the 50 most recent activities for that client by `occurred_at DESC, id
  DESC`, returning `id, type, summary, occurredAt`.

**Actions** return `ActionResult<{ clientId: string }>`.

1. `requireOwnerForAction()`. A failure returns `UNAUTHENTICATED` before any
   input is read.
2. A `clientId` that fails `idSchema` returns `NOT_FOUND`, the same result as
   another owner's id.
3. Invalid input returns `VALIDATION` with `fieldErrors` keyed by field.
4. `NotFoundError` maps to `NOT_FOUND` ("That client could not be found.").
   `ConflictError` maps to `CONFLICT` ("This client is archived and can no
   longer be changed."). Anything else maps to `UNEXPECTED` and logs
   `[clients] <action> failed: <code>`, where the code is the Prisma error code
   or the error name. Logs never contain names, emails, notes, or ids.

**Money** (`src/lib/money.ts`)

- `parseMoney("15,000.50", "NZD")` returns `1500050`. It is string-based: no
  `parseFloat` or `Number()` on the decimal. Thousands commas are allowed, at
  most two decimals, no sign, no exponent. It returns `null` for empty or
  malformed input or a result that is not a safe integer.
- `formatMoney(minor, currency)` uses `Intl.NumberFormat(CURRENCY_LOCALE[currency],
  { style: "currency", currency })` on a decimal string built from the integer,
  so it stays exact. It runs on the server only.
- `minorFromDb(bigint)` converts with `Number(value)` and throws unless
  `Number.isSafeInteger` holds for the result. `minorToDb(number)` requires a
  safe integer and returns `BigInt(value)`.

## Testing

Unit (`npm test`, no database):

- `money`: parse with and without commas, `"0.5"` is 50, `"10"` is 1000; reject
  three decimals, negatives, exponents, letters, misplaced commas, empty input,
  and unsafe results. Format all five currencies, including `0` and a large
  safe value. `minorFromDb` rejects a value above `MAX_SAFE_INTEGER`.
  `minorToDb` rejects fractions.
- `validation/money`: `currencySchema` rejects `EUR`; `moneyInputSchema` rejects
  zero; `idSchema` rejects non-uuids.
- `validation/client`: normalization (trim, lowercase email, uppercase country,
  empty to `null`), every length limit at its boundary, a missing currency, and
  the exact messages.
- `validation/activity`: each payload accepted; an empty `changedFields` and an
  unknown field key rejected.
- `actions/clients`: unauthenticated runs before parsing, a non-uuid id gives
  `NOT_FOUND`, validation field errors, error mapping for `NotFoundError`,
  `ConflictError` and an unknown error, revalidation only on success, and logs
  carrying no client data.

Integration (`npm run test:integration`, local Postgres):

- Create stores normalized values and exactly one `client_created` activity
  linked to the client.
- Update writes `client_updated` with only the changed keys. A no-op update
  writes nothing. Updating an archived client throws `ConflictError`.
- Archive sets `archived_at` once. A second archive succeeds without a second
  activity.
- Owner B gets `NotFoundError` from `updateClient`, `archiveClient`,
  `getClient` and `listClientActivity` on owner A's client, and A's row and
  activity count are unchanged afterwards.
- `listClients` returns only the caller's clients, splits active and archived,
  and orders by name.
- The migration smoke test.

No Browser tests command exists, and this feature has no UI.

## Notes for the AI

- Read `blueprint/database-setup.md` Schema layout and Authoring migrations
  before step 1. Use the installed Prisma 7.10.0 CLI; confirm the
  `externalTables` and `initShadowDb` config keys against it, not newer docs.
- Never run `prisma migrate dev`, `db push`, `migrate deploy`, or Studio, and
  never touch a Neon branch. The only database this feature connects to is the
  local `_test` database.
- `server-only` modules: `permissions.ts`, services, queries, `owner-action.ts`.
  Read env lazily and never throw at module scope.
- Use the tagged `$queryRaw` only for the `FOR UPDATE` lock.
- Error classes need a stable `name` so the action's log code is meaningful.
- Keep `ActionResult` and the `fail`/`invalid` shape consistent with
  `src/actions/auth.ts`; extracting a shared helper is fine if both files use it.
- 17b depends on these exact exports: `clientInputSchema`, `ClientInput`,
  `CLIENT_FIELDS`, `currencySchema`, `CURRENCIES`, the three actions,
  `listClients`, `getClient`, `listClientActivity`, `NotFoundError`.
- Postgres 14 locally versus 17 on Neon: the migration uses nothing newer than
  `gen_random_uuid()` (core since 13). Flag it if the generated SQL needs more.

## Independent review

**Status:** passed
**Target commit:** f126e188b8266b7a91cba90ef680b3530c6f2592
**Base commit:** c9e4143b65485d25b31cbe580d08e1ed2b81a78f
**Base ref:** main
**Spec hash:** 3db960b945dc1f6a0b83ccf52d8219eef722de3f98cdefbe96f012da454bac64
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-08T13:26:15Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-08T13:32:50Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `c9e4143b65485d25b31cbe580d08e1ed2b81a78f..f126e188b8266b7a91cba90ef680b3530c6f2592` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm test`: pass (38 files, 651 tests)
- `npm run test:integration`: pass (3 files, 15 tests, local `portfolio_test`)
- `npm run build`: not run (outside this reviewer's permitted commands)
- `npx prisma validate`: not run (outside this reviewer's permitted commands)

## Evidence

- Freshness confirmed before review: `HEAD` equals the target, `git merge-base main HEAD` equals the base, the spec SHA-256 matches, and only `blueprint/context/review.md` differed from the target.
- All 41 changed files in the delta read; callers followed into `src/server/auth/session.ts`, `src/db/index.ts`, `src/lib/validation/database-env.ts` and `src/actions/auth.ts`.
- Ownership: every service and query loads through `ownedClient` (uuid check, owner-scoped `findFirst`, tagged `$queryRaw ... FOR UPDATE` for writes); owner ids come only from the session; `clientInputSchema` strips unknown keys, so `ownerId`, `archivedAt` and `stripeCustomerId` cannot be supplied from the browser; integration tests prove owner B gets `NotFoundError` from update, archive, get and activity listing with A's data unchanged.
- Migration SQL creates only `public` objects, references `"neon_auth"."user"("id") ON DELETE RESTRICT`, and has no `neon_auth` DDL.
- Money helpers are string/BigInt based with no float parsing; unit tests cover the spec's parse, format and conversion cases.
- Action logs carry only a Prisma code or error class name, verified by `tests/actions/clients.test.ts`.
- F-32 confirmed offline with `pg-connection-string`'s `parse()` and no connection attempt.
- No skipped, focused or placeholder tests in the delta.

## Findings

- F-31 [P2] open: auth-service failure in `ownerAction` throws instead of returning `UNEXPECTED`
- F-32 [P2] open: integration database guard bypassable through a `?host=` query parameter
- F-33 [P3] unverified: client activity feed has no index serving `client_id`
- No P0 or P1 finding is open or fixed. F-24 and F-30 were not re-examined (their files are outside this delta).

## Remaining risk

- `npm run build` and the empty-env build from step 7 were not run in this review, so static generation of public routes was not re-verified here.
- `npx prisma validate` and offline `npm run db:generate` were not run separately (the generated client was exercised by tsc and the integration suite).
- The migration has been applied only to a local PostgreSQL 14 database; no Neon (PostgreSQL 17) branch has it yet.
- `archiveClient` locks first and then runs the conditional `updateMany`, rather than the spec's update-first order; behaviour matches the spec's outcomes, and its `count !== 1` branch is unreachable under the lock.
- No browser evidence: this feature has no UI.
