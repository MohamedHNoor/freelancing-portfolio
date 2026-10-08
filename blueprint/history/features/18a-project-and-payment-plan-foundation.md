# Feature: Project and payment plan foundation

**From build-plan:** feature 18a

**Branch:** feature/project-and-payment-plan-foundation

**Status:** verified

## Goal

Give the dashboard its projects and payment plans as data and server logic, with
no screens yet. A project has a client, a currency and a total. Its milestones
form the payment plan: percentage, fixed or mixed, with an optional upfront
deposit. The plan can never allocate more than the total, and a project can only
be activated when the plan allocates the total exactly. Every rule is enforced on
the server under a project row lock, scoped to the signed-in owner, recorded in
the append-only activity log, and proven by unit and integration tests. Feature
18b builds the screens on top.

## In scope

- `projects` and `milestones` tables, their enums, check constraints and
  composite key, and new `project_id` and `milestone_id` columns on `activities`,
  shipped as one reviewed migration. It is not applied to any Neon branch.
- Shadow database tooling to author this migration, which is the project's
  second.
- `allocate()` in `src/lib/money.ts`, and plan and progress derivations in a new
  `src/lib/finance.ts`.
- Project, milestone, preset and transition schemas, plus the new activity
  payloads.
- The project state machine as a transition table.
- `ownedProject` and `ownedMilestone` loaders, a `ValidationError` mapped by
  `ownerAction`, and activity records linked to the project and milestone.
- Project services: create (with an optional preset), update, status changes and
  draft delete.
- Payment-plan services: create, update, reorder, delete, cancel and restore
  milestones, and apply a preset.
- Project and milestone Server Actions.
- Integration tests for percentage, fixed and mixed plans, over-allocation, the
  activation guard, concurrent plan edits and owner isolation.

## Out of scope

- Every page, component, query module and the sidebar entry (18b), and applying
  the migration to `development` (18b).
- Starting, completing and reopening milestones, and tasks. These are feature
  19. Milestones here are only `pending` or `cancelled`.
- `milestone_started`, `milestone_completed`, `milestone_reopened` and the task
  activity types (19).
- Payment requests, frozen milestones, the currency lock, billable, overdue and
  payment-status derivation (20 and 21). Hooks are named under Notes for the AI,
  not built.
- Client deletion, unarchive, or blocking archive when a client has projects.

## Build loop

`workflow.stepReview` is `feature`, so build every step in order without pausing
for per-step approval. Each step still has to pass its own `Done when` before the
next one starts. Checkpoint commits are disabled. After the last step, run the
final gate and hand over one review packet. The user runs `/check` and
`/complete`, and `/complete` makes the single feature commit.

## Build steps

- [x] **1. Shadow database tooling.**
  - Add an optional `SHADOW_DATABASE_URL` to the live-command datasource in
    `src/lib/validation/database-tooling.ts` and `prisma.config.ts`, as Prisma's
    `shadowDatabaseUrl`.
  - Refuse it unless it is a local host, a database named `portfolio…_shadow`,
    and has no query string, mirroring `assertSafeTestDatabaseUrl`. It is
    dropped and rebuilt on every diff.
  - Add a `db:diff` script that runs
    `prisma migrate diff --from-migrations prisma/migrations --to-schema prisma --script`.
  - Document the variable in `.env.example` and the script in
    `blueprint/database-setup.md` (Authoring migrations) and the AGENTS.md
    Commands.
  - First check `databaseToolDatasource`'s current signature, then extend it
    rather than replacing it.
  - **Done when:** unit tests in `tests/lib/validation/database-tooling.test.ts`
    prove that a remote host, a non-`_shadow` name and a query string are all
    refused, and that offline generation still needs no URL. `npm run db:diff`
    against an empty local shadow database prints SQL equivalent to the committed
    first migration, which proves the replay works. `npm test` passes.

- [x] **2. Schema and migration.**
  - Add `prisma/models/projects.prisma` with `Project` and `Milestone` exactly as
    in Data / contracts.
  - Add the new enums to `enums.prisma`, and the new `ActivityType` values.
  - Give `Activity` `projectId` (CASCADE) and `milestoneId` (SET NULL) with an
    index on `(project_id, occurred_at DESC)`.
  - Add back-relations on `Client`, `NeonAuthUser` and `Activity`.
  - Generate `prisma/migrations/<timestamp>_projects_and_milestones/migration.sql`
    with `npm run db:diff`.
  - Append the check constraints as hand-written SQL, marked with a comment.
    Prisma cannot express them.
  - Add `projects, milestones` to the `TRUNCATE` in
    `tests/integration/support/setup.ts`.
  - Update the table list in `tests/integration/db/migrations.test.ts`.
  - Confirm that the `ALTER TYPE ... ADD VALUE` statements run inside the
    migration transaction against local PostgreSQL. Nothing in the migration uses
    the new values.
  - **Done when:** `npm run db:generate` and `npx tsc --noEmit` pass.
    `npm run test:integration` passes with new
    `tests/integration/db/constraints.test.ts` cases, which prove that raw
    inserts violating each check are rejected:
    - a total of 0
    - an end date before the start date
    - 0 or 10001 basis points
    - percentage mode without basis points
    - fixed mode with basis points
    - a negative position
    - an amount of 0

- [x] **3. Money allocation and plan derivations.**
  - Add `allocate(totalMinor, bpsList)` to `src/lib/money.ts`.
  - Create `src/lib/finance.ts` with `planSummary`, `projectFigures`,
    `milestoneProgress` and `developmentProgress`, as specified in Data /
    contracts.
  - **Done when:** tests in `tests/lib/money.test.ts` and
    `tests/lib/finance.test.ts` pass, covering:
    - a 30% and 50% deposit with 1 to 10 equal milestones, on awkward totals
      (1, 99, 100001, `Number.MAX_SAFE_INTEGER`), sum exactly to the rounded
      target
    - each share is within one minor unit of exact
    - ties go to the later milestone
    - an empty list and an invalid input (bps out of range, a non-safe total)
      throw `RangeError`
    - `developmentProgress` excludes the deposit and cancelled milestones,
      weights by amount and floors, and returns 0 with no eligible milestones

- [x] **4. Validation, presets and activity payloads.**
  - Add `percentInputSchema` and `dateInputSchema` to
    `src/lib/validation/money.ts`.
  - Create `src/lib/validation/project.ts` and `src/lib/validation/milestone.ts`.
  - Create `src/lib/payment-plan.ts` with the pure `buildPreset()`.
  - Extend `activityDataSchema` with the seven new types.
  - **Done when:** tests in `tests/lib/validation/{money,project,milestone,activity}.test.ts`
    and `tests/lib/payment-plan.test.ts` pass. They cover valid and invalid input
    for every field, the pricing-mode discriminated union, the date refinement,
    and the payloads of the new activity types. Presets must produce the exact
    rows listed in Data / contracts. `npm test` passes.

- [x] **5. Project state machine.**
  - Create `src/lib/state/project.ts`, a transition table plus
    `nextProjectStatus(from, action)`.
  - **Done when:** `tests/lib/state/project.test.ts` asserts every allowed
    transition and that every other (status, action) pair returns null.

- [x] **6. Ownership, errors and activity links.**
  - Add `ownedProject` and `ownedMilestone` to `src/lib/permissions.ts`, with the
    same contract as `ownedClient`.
  - Add `ValidationError(fieldErrors)` there too, and map it in `ownerAction` to
    `VALIDATION` with those `fieldErrors`.
  - Let `recordActivity` accept `projectId` and `milestoneId`.
  - **Done when:** new `ownerAction` unit tests prove that `ValidationError`
    returns `VALIDATION` with its field errors and no log line. Integration tests
    prove that both loaders return the owner's own row and raise `NotFoundError`
    for a malformed id, a missing id and owner B's id, with and without
    `forUpdate`. `npm test` and `npm run test:integration` pass.

- [x] **7. Project services.**
  - Create `src/server/services/projects.ts` with `createProject` (including an
    optional preset), `updateProject`, `changeProjectStatus` and
    `deleteProject`. Rules are in Data / contracts.
  - **Done when:** `tests/integration/server/services/projects.test.ts` passes,
    covering:
    - creation with and without each preset
    - creation for an archived client returns Conflict
    - creation for owner B's client returns NotFound
    - a total change recomputes percentage milestones and is rejected below the
      fixed sum
    - activation succeeds only when allocated equals the total (unbalanced,
      over-allocated and empty plans are all rejected)
    - every transition sets and clears the right timestamps
    - complete is refused while a non-cancelled milestone is not completed
    - delete works only on a draft and cascades its milestones and activities
    - one activity per change, with `projectId` and `clientId` set
    - owner B gets NotFound on every function

- [x] **8. Payment-plan services.**
  - Create `src/server/services/payment-plan.ts` with `createMilestone`,
    `updateMilestone`, `reorderMilestones`, `deleteMilestone`,
    `cancelMilestone`, `restoreMilestone` and `applyPlanPreset`.
  - **Done when:** `tests/integration/server/services/payment-plan.test.ts`
    passes, covering:
    - percentage-only, fixed-only and mixed plans balancing exactly at 30% and
      50% deposits
    - over-allocation rejected with a field error
    - a second upfront milestone rejected
    - a reorder that moves the deposit, or uses a stale or incomplete id list,
      returns Conflict
    - delete is draft-only and compacts positions
    - cancel frees its amount, and restore is refused when it would over-allocate
    - a preset applies only to an empty draft plan
    - edits on completed and cancelled projects return Conflict
    - **two concurrent `createMilestone` calls that each fit alone but not
      together leave exactly one milestone**
    - owner B gets NotFound on every function

- [x] **9. Server Actions and documentation.**
  - Create `src/actions/projects.ts` and `src/actions/milestones.ts`, following
    `src/actions/clients.ts`.
  - Update `blueprint/database-setup.md` to record the second migration, still
    unapplied.
  - Update `blueprint/dashboard-architecture.md` to record where 18a diverges
    from the plan (Notes for the AI).
  - **Done when:** `tests/actions/projects.test.ts` and
    `tests/actions/milestones.test.ts` pass, with services, session and
    `revalidatePath` mocked as in `tests/actions/clients.test.ts`. They cover:
    - signed out returns UNAUTHENTICATED
    - a malformed id returns NOT_FOUND before validation
    - invalid input returns VALIDATION with field errors
    - service errors map to their codes and messages
    - success revalidates the listed paths

  **Final gate:** `npm run lint`, `npx tsc --noEmit`, `npm test`,
  `npm run test:integration` and `npm run build` all pass.

## Files / areas

- **New:**
  - `prisma/models/projects.prisma`
  - `prisma/migrations/<timestamp>_projects_and_milestones/`
  - `src/lib/finance.ts`
  - `src/lib/payment-plan.ts`
  - `src/lib/state/project.ts`
  - `src/lib/validation/project.ts`
  - `src/lib/validation/milestone.ts`
  - `src/server/services/projects.ts`
  - `src/server/services/payment-plan.ts`
  - `src/actions/projects.ts`
  - `src/actions/milestones.ts`
  - The matching tests under `tests/` and `tests/integration/`
- **Changed:**
  - `prisma/models/{enums,activities,clients,neon-auth}.prisma`
  - `prisma.config.ts`
  - `package.json`
  - `.env.example`
  - `src/lib/validation/database-tooling.ts`
  - `src/lib/money.ts`
  - `src/lib/validation/{money,activity}.ts`
  - `src/lib/permissions.ts`
  - `src/server/owner-action.ts`
  - `src/server/services/activity.ts`
  - `tests/integration/support/setup.ts`
  - `tests/integration/db/migrations.test.ts`
  - `AGENTS.md` (Commands)
  - `blueprint/database-setup.md`
  - `blueprint/dashboard-architecture.md`
- **Untouched:** all of `src/app/`, `src/components/` and the public site.

## Data / contracts

### Schema

These follow the `dashboard-architecture.md` §4 conventions:
- uuid primary keys with `gen_random_uuid()`
- snake_case through `@map`/`@@map`
- `@@schema("public")`
- `created_at`/`updated_at` as `timestamptz` with `@updatedAt`
- money as `BigInt`
- calendar dates as `@db.Date`

**Enums**

| Enum | Values |
|---|---|
| `project_status` | `draft`, `active`, `on_hold`, `completed`, `cancelled` |
| `milestone_status` | `pending`, `in_progress`, `completed`, `cancelled` |
| `milestone_billing_trigger` | `upfront`, `on_completion` |
| `milestone_pricing_mode` | `percentage`, `fixed` |

`activity_type` gains `project_created`, `project_updated`,
`project_status_changed`, `payment_plan_changed`, `milestone_created`,
`milestone_updated` and `milestone_cancelled`.

**`projects`**

| Column | Definition |
|---|---|
| `owner_id` | FK `neon_auth.user`, RESTRICT |
| `client_id` | FK `clients`, RESTRICT |
| `name` | text |
| `description` | text, nullable |
| `status` | default `draft` |
| `currency` | |
| `total_amount_minor` | bigint, CHECK `> 0` |
| `start_date`, `expected_end_date` | date, nullable, CHECK `expected_end_date >= start_date` when both are set |
| `activated_at`, `completed_at`, `cancelled_at` | timestamptz, nullable |

Indexes: `(owner_id, status)` and `(client_id)`.

**`milestones`**

| Column | Definition |
|---|---|
| `project_id` | FK `projects`, CASCADE |
| `name` | text |
| `description` | text, nullable |
| `position` | int, CHECK `>= 0` |
| `billing_trigger` | default `on_completion` |
| `pricing_mode` | |
| `percentage_bps` | int, nullable, CHECK `BETWEEN 1 AND 10000` |
| `amount_minor` | bigint, CHECK `> 0` |
| `status` | default `pending` |
| `due_date` | date, nullable |
| `started_at`, `completed_at`, `cancelled_at` | timestamptz, nullable |

Constraints and indexes:
- `UNIQUE (id, project_id)`
- `CHECK ((pricing_mode = 'percentage') = (percentage_bps IS NOT NULL))`
- index `(project_id, position)`
- no unique constraint on `position`

**`activities`** gains:
- `project_id` uuid, nullable, FK CASCADE
- `milestone_id` uuid, nullable, FK SET NULL
- index `(project_id, occurred_at DESC)`

### Money and finance (pure, no I/O)

**`allocate(totalMinor: number, bpsList: number[]): number[]`**
- Uses BigInt arithmetic and the largest-remainder method.
- The result sums exactly to `round(total × Σbps / 10000)`, rounding half up.
- Each share is within one minor unit of exact. Ties go to the later index.
- Throws `RangeError` for an unsafe total, bps outside 1 to 10000, or Σbps above
  10000.

**`planSummary(totalMinor, milestones)`**
- Returns `{ allocated, unallocated, balanced }`.
- Only non-cancelled milestones count.
- `balanced` means `allocated === total`.

**`projectFigures({ totalMinor, paidMinor, requestedMinor })`**
- Returns `{ paid, outstanding: total − paid, requested, paymentProgress: floor(paid × 100 / total) }`.
- In 18a, callers pass 0 for paid and requested.

**`milestoneProgress({ status, doneTasks, activeTasks })`**
- 100 when the milestone is completed.
- Otherwise `floor(done × 100 / active)`.
- 0 when it has no active tasks.

**`developmentProgress(milestones)`**
- An amount-weighted, floored average over non-cancelled `on_completion`
  milestones.
- Returns 0 when there are none.

### Validation

These schemas live in `src/lib/validation/` and are shared by the forms and
actions. Each exports its `z.input` and `z.output` types.

**Shared**
- `percentInputSchema`: text such as `"12.5"` becomes 1250 bps. It must be more
  than 0 and at most 100, with at most 2 decimals. Parse it as a string, never
  with `parseFloat`.
- `dateInputSchema`: `YYYY-MM-DD` and a real calendar date. Empty becomes null.

**`projectInputSchema`**

| Field | Rule |
|---|---|
| `clientId` | uuid |
| `name` | trimmed, 1 to 120 characters |
| `description` | optional, at most 5000 characters, empty becomes null |
| `currency` | |
| `total` | text, converted with `parseMoney` in the chosen currency, more than 0; field error on `total` |
| `startDate`, `expectedEndDate` | optional; a refinement puts a field error on `expectedEndDate` when it is before `startDate` |
| `preset` | optional |

`projectUpdateSchema` is the same schema without `clientId` and `preset`. A
project's client is fixed at creation.

`projectStatusActionSchema` is `{ action: "activate" | "pause" | "resume" | "complete" | "reopen" | "cancel" }`.

**`milestoneInputSchema`**

A discriminated union on `pricingMode`:
- `percentage` takes `percent`
- `fixed` takes `amount` as text, trimmed and non-empty

Shared fields:
- `name`: trimmed, 1 to 120 characters
- `description`: optional, at most 2000 characters
- `billingTrigger`
- `dueDate`: optional

The amount is converted on the server with `parseMoney(amount, project.currency)`
inside the transaction. A failure throws `ValidationError({ amount: [...] })`.

**Other schemas**
- `reorderMilestonesSchema`: `{ ids: uuid[] }`, at least one id, no duplicates.
- `planPresetSchema`: `{ kind: "deposit_30" | "deposit_50" | "fixed", count: integer 1..10 }`.

### Presets (`buildPreset(kind, count, totalMinor)`)

Presets are shortcuts that produce editable draft rows, not rules.

**`deposit_30` and `deposit_50`**
- Position 0 is `Deposit`: upfront, percentage, 3000 or 5000 bps.
- Then `Milestone 1` to `Milestone N`: on completion, percentage. They share the
  remaining bps by largest remainder, with ties to later rows. For example, 7000
  over 3 gives 2333, 2333 and 2334.
- Amounts come from `allocate`.

**`fixed`**
- `Milestone 1` to `Milestone N`: on completion, fixed.
- The total is split evenly in minor units, with the remainder going to the later
  rows.
- There is no deposit.

Every preset balances exactly.

### Project state machine (`src/lib/state/project.ts`)

| From | Action | To |
|---|---|---|
| `draft` | `activate` | `active` |
| `active` | `pause` | `on_hold` |
| `on_hold` | `resume` | `active` |
| `active` | `complete` | `completed` |
| `completed` | `reopen` | `active` |
| `draft`, `active`, `on_hold` | `cancel` | `cancelled` |

Any other pair returns null, and the service maps that to Conflict.

Guards are enforced in the service:
- **activate:** `planSummary` is balanced, which implies at least one
  non-cancelled milestone.
- **complete:** every non-cancelled milestone is `completed`.

Timestamps:
- `activated_at` is set on activate.
- `completed_at` is set on complete and cleared on reopen.
- `cancelled_at` is set on cancel.

Status writes are conditional, using `updateMany` with `WHERE status = from`. A
count other than 1 raises Conflict.

### Service rules

These apply to `projects.ts` and `payment-plan.ts`.

**Every mutation**
- Runs in one transaction.
- Loads its record with `ownedProject` or `ownedMilestone` using `forUpdate`, and
  locks the **project row** before reading the plan.
- Writes exactly one activity in the same transaction. The activity carries
  `projectId`, `clientId` and, where relevant, `milestoneId`.
- Summaries name the project or milestone, for example
  `Created project Acme website` and `Cancelled milestone Backend`.

**Editability**
- The project and its plan can change only while the project is `draft`,
  `active` or `on_hold`. Otherwise the service raises Conflict.
- A cancelled milestone cannot be edited. Restore it first.

**Plan invariant**
- After every write, the non-cancelled amounts must not exceed the total.
- A breach rolls back and raises `ValidationError` on the edited field (`amount`,
  `percent` or `total`), or Conflict for a restore or a preset.

**Recompute**
- Any change to the total or to a percentage milestone re-runs `allocate` over
  all non-cancelled percentage milestones, in position order.

**Deposit**
- There is at most one `upfront` milestone, and it is always at position 0.
- Creating one shifts the other milestones down. Creating a second, or a reorder
  or update that would move it, raises Conflict.

**Positions**
- Positions are contiguous from 0 across all of a project's milestones.
- Create appends a milestone.
- Delete compacts the positions.
- Reorder takes the exact current id set, or raises Conflict.

**Delete and cancel**
- `deleteMilestone` works only while the project is `draft`.
- `cancelMilestone` works from `pending` or `in_progress` and sets
  `cancelled_at`.
- `restoreMilestone` returns a milestone to `pending`, clears `cancelled_at`, and
  must keep the invariant.
- `deleteProject` works only on a draft. Milestones and project activities
  cascade.

**Presets and creation**
- `applyPlanPreset` and the `createProject` preset apply only to a draft with no
  milestones.
- `createProject` requires a non-archived client of the owner's, otherwise
  Conflict. The currency is taken from the input and is not forced to match the
  client's default.

**Unchanged saves**
- An update that changes nothing writes no row and no activity, matching
  `updateClient`.

### Activity payloads

Payloads carry field names only, never values.

| Type | Payload |
|---|---|
| `project_created` | `{}` |
| `project_updated` | `{ changedFields: ProjectField[] }` |
| `project_status_changed` | `{ from, to }` |
| `payment_plan_changed` | `{ change: "preset_applied" \| "reordered" \| "milestone_deleted" \| "milestone_restored" }` |
| `milestone_created` | `{}` |
| `milestone_updated` | `{ changedFields: MilestoneField[] }` |
| `milestone_cancelled` | `{}` |

### Actions

Every action uses `ownerAction`, which runs the owner check, then the id, then
the schema, then the service.

| File | Action | Returns |
|---|---|---|
| `src/actions/projects.ts` | `createProject(raw)` | `{ projectId }` |
| | `updateProject(projectId, raw)` | `{ projectId }` |
| | `changeProjectStatus(projectId, raw)` | `{ projectId }` |
| | `deleteProject(projectId)` | `{ projectId }` |
| `src/actions/milestones.ts` | `createMilestone(projectId, raw)` | `{ projectId, milestoneId }` |
| | `applyPlanPreset(projectId, raw)` | `{ projectId }` |
| | `reorderMilestones(projectId, raw)` | `{ projectId }` |
| | `updateMilestone(milestoneId, raw)` | `{ projectId, milestoneId }` |
| | `deleteMilestone(milestoneId)` | `{ projectId, milestoneId }` |
| | `cancelMilestone(milestoneId)` | `{ projectId, milestoneId }` |
| | `restoreMilestone(milestoneId)` | `{ projectId, milestoneId }` |

On success, an action revalidates `/dashboard/projects`,
`/dashboard/projects/<projectId>` and `/dashboard/clients/<clientId>`.

Messages are friendly and never include provider or database text:
- `NOT_FOUND`: "That project could not be found." or "That milestone could not be
  found."
- `CONFLICT`: "That change is no longer possible for this project."

## Testing

**Unit tests (`npm test`)**
- allocation and finance
- every schema
- presets
- the state machine
- `ownerAction` mapping of `ValidationError`
- the shadow database URL guard
- both action modules, with mocks

**Integration tests (`npm run test:integration`, local PostgreSQL)**
- the check constraints
- both loaders
- the project and payment-plan services, including:
  - the concurrent over-allocation race
  - owner B isolation on every service function

**Not claimed:** browser evidence (there is no UI), and anything on a Neon
branch, since the migration is applied in 18b. If local PostgreSQL or
`TEST_DATABASE_URL` is unavailable, report that integration tests did not run.
Do not mark those steps done.

## Notes for the AI

- **Follow the 17a patterns exactly:**
  - the `ownedClient` lock-then-load
  - `ownerAction`
  - `recordActivity` inside the transaction
  - `CLIENT_FIELDS`-style field lists for `changedFields`
  - `minorToDb`/`minorFromDb` at the boundary
  - tagged `$queryRaw` only
- **Lock order:** take the project row lock before any milestone lock, in every
  service. This keeps concurrent plan edits from deadlocking.
- **Dates:** write `@db.Date` values as `new Date("YYYY-MM-DDT00:00:00Z")`, and
  read them back with the UTC parts. Never use local time.
- **Hooks for later features:**
  - Feature 20 adds the currency lock, frozen milestones (excluded from
    recompute) and closing open requests on cancel.
  - Feature 19 adds start, complete and reopen.
  - Leave one clearly named spot for each, such as a `isFrozen` that currently
    returns false. Do not stub tables.
- **Independent review:** this feature sets money rules under a lock, so the
  `when-sensitive` independent review may be selected at the end.
- **Divergences to record in `dashboard-architecture.md` §16 and §19:**
  - There are no queries yet.
  - The client is immutable after creation.
  - A preset only applies to an empty draft.
  - Restore and reorder are recorded as `payment_plan_changed`.

## Open questions

These are product defaults I chose. None blocks implementation, and each is cheap
to change before 18b's screens:

1. **"Fixed amounts" preset.** It currently makes N equal fixed milestones with
   no deposit. Should it include a fixed deposit?
2. **Preset size.** N is between 1 and 10.
3. **Fixed client.** A project's client cannot change after creation.
4. **Name limits.** Project and milestone names are at most 120 characters.
   Milestone descriptions are at most 2000 characters.

## Independent review

**Status:** passed
**Target commit:** b4e0ab35d4fec3654569b0c4d86fbb61144edc27
**Base commit:** 3dc4bb4169a9f1ec9dd6a1d984b4c028a3f7f1f1
**Base ref:** main
**Spec hash:** 7d3a9656f21e74f4e87430ea50631b0a6900be4b18ddeb300f873cb50f67a141
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-08T17:07:36Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-08T17:17:47Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `3dc4bb4169a9f1ec9dd6a1d984b4c028a3f7f1f1..b4e0ab35d4fec3654569b0c4d86fbb61144edc27` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

### Commands

- `npm run lint`: pass
- `npx tsc --noEmit`: pass
- `npm test`: pass (50 files, 912 tests)
- `npm run test:integration`: pass (7 files, 77 tests, local PostgreSQL)
- `npm run build`: pass (dashboard routes dynamic, public routes static or SSG)

### Evidence

- Freshness confirmed before review: `HEAD` = target, `git merge-base main HEAD` = base, `current-feature.md` SHA-256 = spec hash, only `blueprint/context/review.md` differed from the target.
- Whole delta reviewed (55 files): migration, Prisma models, `src/lib/{money,finance,payment-plan,dates,permissions}.ts`, `src/lib/state/project.ts`, all new validation schemas, `src/server/services/{projects,payment-plan,activity}.ts`, `src/server/{owner-action,revalidate}.ts`, `src/actions/{projects,milestones}.ts`, shadow-database tooling and all new tests.
- Owner isolation: every service enters through `ownedProject`/`ownedMilestone`/`ownedClient` with `forUpdate`; the lock queries filter `owner_id` and malformed ids raise `NotFoundError`; `deleteProject` re-filters `ownerId`; reorder writes only ids proven to belong to the locked project. Owner-B tests cover every service function.
- Plan invariant: every plan mutation locks the project row first (`ownedMilestone` uses `FOR UPDATE OF p`), reads the plan after the lock, and runs `computePlan`, which re-allocates non-cancelled percentage rows with BigInt `allocate` and refuses `allocated > total` in BigInt. Status changes and cancel/restore are conditional `updateMany` writes. No path locks a milestone or client after a project, so lock order cannot invert. The concurrent `createMilestone` race test passes against a 5-connection pool.
- Money: no float parsing (`parseMoney`, `percentInputSchema` are string/integer based); `minorToDb`/`minorFromDb` at every boundary; `allocate` throws `RangeError` on unsafe input; zero shares are refused before the `amount_minor > 0` check could fire.
- Migration: the six hand-written checks match the spec (NULL-tolerant where columns are nullable); `ALTER TYPE ... ADD VALUE` values are unused within the migration; FKs are CASCADE/SET NULL/RESTRICT as specified.
- Activity: exactly one `recordActivity` per change inside the same transaction with `projectId`, `clientId` and `milestoneId` where the row survives; payloads carry field names only and are schema-validated.
- `"use server"` modules export only async action functions; `milestoneCommand` is module-private and `revalidateProject` lives in a `server-only` module.

### Findings

- F-34 [P3] open: preset too-small path returns a `preset` ValidationError rather than the spec's Conflict, untested.
- F-35 [P3] unverified: per-row sequential UPDATEs under the project lock with no milestone cap.
- No P0 or P1 finding.

### Remaining risk

- `/check` not run (not required); no browser evidence, as there is no UI in 18a.
- The migration is verified only against local PostgreSQL; it has not been applied to any Neon branch (deferred to 18b).
- Concurrency is proven for the `createMilestone` race only; other concurrent pairs rely on the same project lock by code inspection.
