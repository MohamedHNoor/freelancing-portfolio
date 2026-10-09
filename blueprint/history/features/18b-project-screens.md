# Feature: Project screens

**From build-plan:** feature 18b

**Branch:** feature/project-screens

**Status:** verified

## Goal

Give the owner screens for the projects and payment plans that feature 18a built
without a UI. The owner can list projects by status and create a project for a
client, with a total and an optional plan preset. Each project gets a page with
its payment plan and separate development and payment progress. The owner can
edit the plan until it balances and change the project's details and status. A
draft can be deleted. Client detail lists that client's projects. The 18a
migration is applied to the Neon `development` branch, and the screens are
verified in a browser.

## Design reference

- `prototypes/project.html`: project header, progress pair, milestone plan.
- `prototypes/create.html`: client, details and payment plan on one page, with
  the balanced and unallocated states.
- `prototypes/theme.css`: tokens were ported in 16c and 17b. Port a token only
  if a screen here needs one that `globals.css` lacks.
- `blueprint/dashboard-architecture.md` §19 (routes), §20 (components), §21
  (screens 10 to 14), §23 (project page). The 17b client screens are the
  working pattern for layout, forms, feedback, empty states and loading.

The prototypes show tasks, payment requests, a "Next action" column and an
activity timeline. Those belong to features 19 and 20 and are not built here.

## In scope

- **Navigation:** Projects joins `WORKSPACE_NAV` and leaves the sidebar's
  "Coming soon" list.
- **Projects list** `/dashboard/projects`:
  - Status tabs: All (default), Draft, Active, On hold, Completed and Cancelled,
    selected with `?status=`.
  - Each row shows the project name (a link to its page), the client's display
    name, a textual status badge, the total in its currency, and the plan state:
    "Balanced", or "<amount> unallocated".
  - A "New project" button.
  - An empty state for each tab.
- **New project** `/dashboard/projects/new`, on one page:
  - **Client:** a select of the owner's active clients. `?clientId=` preselects
    one, but only when it matches an id in that list.
  - **Details:** name, description, currency, total, start date and expected
    end date. Choosing a client sets the currency to that client's default
    currency, and the owner can still change it.
  - **Payment plan:** None, "30% deposit + N milestones", "50% deposit + N
    milestones" or "Fixed amounts (N equal milestones)", with N from 1 to 10.
  - When the owner has no active clients, an empty state links to New client
    instead of showing the form.
  - Success goes to the new project's page.
- **Project page** `/dashboard/projects/[projectId]`:
  - **Header:** name, status badge, the client (a link to client detail),
    currency, and dates when set. It links to Edit plan, while the plan is
    editable, and to Settings.
  - **Progress pair:** a Development meter and a Payments meter, each a labelled
    `role="progressbar"` with its percentage as text.
  - **Figures:** Total, Paid, Outstanding, Requested and Unallocated, in
    tabular figures.
  - **Payment plan table:** milestone, amount, share, work status, payment
    status and due date. Share is the percentage for a percentage milestone and
    "Fixed" for a fixed one. Work status for the deposit reads "Deposit".
    Payment status reads "Unbilled" until feature 20.
  - **Draft notice:** a draft whose plan cannot activate yet says why: no
    milestones, or "<amount> still to allocate". It links to the plan editor.
  - Description shown with preserved line breaks.
  - Empty plan state when there are no milestones.
- **Plan editor** `/dashboard/projects/[projectId]/plan`:
  - A summary from the server: total, allocated, unallocated, and whether the
    plan is balanced.
  - Each milestone row can be edited inline: name, description, billing trigger,
    pricing mode with a percentage or amount, and due date.
  - Rows move up and down with buttons. The deposit stays first.
  - Delete a milestone while the project is a draft. Cancel one in an active or
    on-hold project. Restore a cancelled one. Delete and cancel each ask for
    confirmation.
  - An add-milestone form.
  - The preset picker appears only while the project is a draft with no
    milestones.
  - "Upfront deposit" is offered only where the service allows it.
  - A completed or cancelled project's plan URL redirects to the project page.
- **Project settings** `/dashboard/projects/[projectId]/settings`:
  - A details form (name, description, currency, total and dates) while the
    project is draft, active or on hold. Otherwise the page says the details are
    locked.
  - The status changes valid from the current status: Activate, Pause, Resume,
    Complete, Reopen and Cancel. Activate and Complete are disabled, with their
    reason in text, when the server's guard would refuse them. Cancel asks for
    confirmation.
  - Delete a draft, with confirmation. Success goes to `/dashboard/projects`.
- **Client detail:**
  - A Projects section listing the client's projects with name, status and
    total, or an empty message.
  - A "New project" link to `/dashboard/projects/new?clientId=<id>`. Archived
    clients do not get it.
- Each new route segment gets `loading.tsx`, `error.tsx` and a scoped
  `not-found.tsx`, following `dashboard/clients/`.
- Apply migration `20261009120000_projects_and_milestones` to the Neon
  `development` branch, with separate approval.
- Browser verification of every screen and state in both themes, at desktop and
  phone widths.

## Out of scope

- Milestone detail pages, tasks, milestone start, complete and reopen, and the
  project activity timeline. These are feature 19, so plan rows do not link
  anywhere yet.
- Payment requests, pay links, the "Next action" column, real paid, requested
  and outstanding figures, and the currency lock. These are features 20 and 21.
- The overview dashboard and per-currency totals. These are feature 22.
- Changing a project's client, which 18a fixed at creation.
- Drag-and-drop reordering. Up and down buttons cover reordering here.
- Any change to the 18a services, schemas, state machine or migration, except
  the small helper exports named in the build steps.
- Applying any migration to `production`.
- A browser test harness.

## Build loop

`workflow.stepReview` is `feature`, so build every step in order without pausing
for per-step approval. Run each step's own checks before moving on. Checkpoint
commits are disabled. Step 9's live migration is the exception: it waits for an
explicit yes in chat naming the target. After the final step, hand over one
review packet: every step's evidence, then `npm run lint`, `npx tsc --noEmit`,
`npm test`, `npm run test:integration` and `npm run build`. The owner then runs
`/check` and `/complete`, and `/complete` creates the feature commit.

## Build steps

- [x] **1. Pure helpers and navigation**
  - `src/lib/money.ts`: export `minorToInput(minor, currency)`, the exact
    decimal string without grouping or symbol ("15000.00"), built on the
    existing `toDecimalString`. `parseMoney(minorToInput(x, c), c) === x` must
    hold.
  - `src/lib/dashboard/projects.ts`:
    - `parseProjectStatusFilter(value)` returns a `ProjectStatus` only for an
      exact single valid string. Anything else, including an array, gives `"all"`.
    - `PROJECT_STATUS_LABELS` maps draft, active, on_hold, completed and
      cancelled to Draft, Active, On hold, Completed and Cancelled.
      `MILESTONE_WORK_LABELS` maps pending, in_progress, completed and cancelled
      to Not started, In progress, Completed and Cancelled.
    - `bpsToPercentInput(bps)` turns 3000 into "30" and 1250 into "12.5", and
      round-trips through `percentInputSchema`. `formatPercent(bps)` turns 1250
      into "12.5%".
    - `projectFormValues(project)` gives `ProjectUpdateInput`, with nulls as
      `""`. `milestoneFormValues(milestone, currency)` gives `MilestoneInput`.
    - `projectStatusActions(status, { canActivate, canComplete })` lists the
      actions from `PROJECT_TRANSITIONS` that are valid from `status`, in table
      order. Each one says whether it is enabled and, when it is not, gives a
      reason: "Balance the payment plan first" or "Complete every milestone
      first".
  - `src/lib/dashboard/navigation.ts`: add Projects at `/dashboard/projects`
    after Clients. Remove Projects from the "Coming soon" list in
    `AppSidebar.tsx`.
  - Tests (every currency uses two decimals, so the round trip covers those
    only):
    - `tests/lib/money.test.ts` (extended)
    - `tests/lib/dashboard/projects.test.ts`
    - `tests/lib/dashboard/navigation.test.ts` (extended: `/dashboard/projects/x`
      is current for Projects; `/dashboard/projectsx` is not)
  - **Done when:** `npm test` and `npx tsc --noEmit` pass. The tests cover the
    round trips for zero-exponent and two-exponent currencies, every status's
    action list, and both disabled reasons.

- [x] **2. Project queries**
  - `src/server/queries/projects.ts` (`server-only`). Every function takes
    `ownerId` first and filters by it in the query itself:
    - `listProjects(ownerId, { status })`: newest `createdAt` first, ties by id,
      with the client's `name` and `companyName`. Each row includes its plan
      summary, from `planSummary` over its milestones' `status` and
      `amountMinor`, which are loaded in the same query.
    - `listClientProjects(ownerId, clientId)`: loads `ownedClient` first, which
      throws `NotFoundError` for another owner's client, then returns the same
      row shape.
    - `listProjectClients(ownerId)`: the owner's active clients for the picker
      (`id`, display name, `defaultCurrency`), by name.
    - `getProjectView(ownerId, projectId)`: loads `ownedProject`, then its
      client and its milestones by `position`. It returns plain numbers and
      server-derived values: `planSummary`, `projectFigures` (paid and requested
      are 0 until feature 21), each milestone's progress from
      `milestoneProgress` (zero tasks until feature 19), `developmentProgress`,
      `canActivate` (draft, at least one non-cancelled milestone, balanced) and
      `canComplete` (active, and every non-cancelled milestone completed).
      Money is never formatted here.
  - `src/server/revalidate.ts`: `revalidateProject` also revalidates the
    project's nested pages, using `revalidatePath(`/dashboard/projects/${id}`,
    "layout")`.
  - Tests: `tests/integration/server/queries/projects.test.ts`. Two seeded
    owners: owner B gets an empty list, and `NotFoundError` from
    `getProjectView` and `listClientProjects`. Also cover the status filter,
    ordering, plan summary, `canActivate` for an unbalanced and a balanced
    draft, and archived clients left out of the picker.
  - **Done when:** `npm run test:integration` and `npm test` pass.

- [x] **3. Shared pieces and the projects list**
  - `src/components/dashboard/shared/`:
    - `StatusBadge`: the label carries the meaning and colour only reinforces
      it.
    - `ProgressMeter`: labelled `role="progressbar"`, with `aria-valuenow`,
      `aria-valuemin`, `aria-valuemax` and the visible percentage.
    - `MoneyAmount`: renders a pre-formatted string with `tabular-nums`.
    - `ConfirmDialog`: wraps `alert-dialog`. Pending disables the confirm
      button, and focus returns to the trigger.
  - `src/components/dashboard/projects/ProjectTable.tsx`. Follow
    `ClientTable`: on mobile, rows reflow and nothing scrolls horizontally.
  - `src/app/dashboard/projects/page.tsx`:
    - `requireOwner`, then `parseProjectStatusFilter`, then `listProjects`.
    - The page formats money on the server.
    - Tab nav uses `aria-label="Project status"` and `aria-current="page"`.
    - Each tab has its own empty state, with New project on All.
  - Also `projects/loading.tsx` and `projects/error.tsx`.
  - Metadata title: "Projects".
  - **Done when:** `/dashboard/projects` renders for the signed-in owner with
    every tab and its empty state. `?status=bogus` shows All. A signed-out
    request redirects to `/login`. Lint and typecheck pass.

- [x] **4. New project**
  - `src/components/dashboard/projects/ProjectForm.tsx` is a client leaf. It
    uses react-hook-form, `zodResolver(projectInputSchema)`, `Field`,
    `AuthFeedback` and `useAuthFeedback`, as `ClientForm` does.
  - Fields in focus order: client, name, description, currency, total, start
    date, expected end date, plan preset, then milestone count. The count field
    is shown and enabled only when a preset is chosen. With None, `preset` is
    sent as `null`.
  - **Errors:**
    - The first invalid field is focused.
    - Server `fieldErrors` map through `setError`. A `preset` error lands on the
      preset group.
    - `CONFLICT`, for a client archived in the meantime, and `UNEXPECTED` show
      in the announced feedback region.
    - Errors clear on edit.
  - **Changing the client** sets `currency` to that client's default through
    `setValue`.
  - **Submit** disables while pending. Success calls `router.push` to the
    project page.
  - `src/app/dashboard/projects/new/page.tsx`: `requireOwner` and
    `listProjectClients`. The page validates `?clientId=` against that list
    before passing a default. With no active clients it shows an empty state
    linking to `/dashboard/clients/new`. Metadata title: "New project".
  - **Done when:** in the browser, a project with each preset and with None is
    created and lands on its page. Client-side and server-side field errors show
    and are announced. Lint and typecheck pass.

- [x] **5. Project page**
  - `src/app/dashboard/projects/[projectId]/page.tsx`:
    - `requireOwner`, then `getProjectView` through the same
      `loadOrNotFound` pattern as client detail.
    - The scoped `[projectId]/not-found.tsx` covers missing, malformed and
      other owners' ids alike.
    - Metadata title: "Project".
  - Components in `src/components/dashboard/projects/`:
    - `ProjectHeader`
    - `ProgressPair`
    - `PaymentPlanTable`: amounts formatted on the server, percentages via
      `formatPercent`. Cancelled rows are visibly marked "Cancelled" in text and
      excluded from the figures.
  - The draft activation notice and the empty plan state.
  - The Edit plan link appears only while the status is draft, active or on
    hold.
  - **Done when:** in the browser, a balanced draft, an unbalanced draft and a
    project with no milestones each render correctly. A random UUID and another
    owner's id both show the scoped not-found page. Lint and typecheck pass.

- [x] **6. Plan editor**
  - `src/app/dashboard/projects/[projectId]/plan/page.tsx`:
    - `requireOwner` and `getProjectView`.
    - A completed or cancelled project redirects to its project page.
    - Metadata title: "Payment plan".
  - `PlanEditor` (client leaf):
    - **Summary bar.** It renders server-provided, pre-formatted figures only;
      the client never computes money. After each successful action it calls
      `router.refresh()`.
    - **`MilestoneRow`.** Read view plus an inline edit form, using
      `milestoneInputSchema` and `updateMilestone`.
    - **Buttons:**
      - Move up and Move down call `reorderMilestones` with the full id order.
        Both are disabled where they would move the deposit off position 0.
      - Delete (draft only) and Cancel (draft, active or on hold), each with
        `ConfirmDialog`.
      - Restore for cancelled rows.
      - Each button has an accessible name that includes the milestone's name.
    - **Add-milestone form.** Uses `createMilestone`.
    - **`PlanPresetPicker`.** Draft with no milestones only. Uses
      `applyPlanPreset`.
    - **Deposit option.** `billingTrigger: "upfront"` is offered only where the
      server allows it: when adding while no upfront milestone exists, and when
      editing the first row while no other upfront exists. The page computes
      both flags.
  - **Feedback:**
    - Field errors, including the service's over-allocation and zero-share
      messages, appear on their field.
    - `CONFLICT` and `NOT_FOUND` show in the announced region.
    - After a reorder, focus stays on the moved row's button.
  - **Done when:** in the browser:
    - Add, edit, reorder, delete, cancel, restore and preset each work and
      update the summary.
    - Over-allocating shows the field error.
    - Each operation works by keyboard alone.
    - A completed project's plan URL redirects.
    - Lint and typecheck pass.

- [x] **7. Project settings**
  - `src/app/dashboard/projects/[projectId]/settings/page.tsx`: `requireOwner`
    and `getProjectView`. Metadata title: "Project settings".
  - **Details form.** `ProjectForm` in edit mode with `projectUpdateSchema`,
    filled from `projectFormValues`, with no client field. Shown only for
    draft, active or on hold. Success shows a `role="status"` message and
    refreshes. A total that no longer fits the plan shows the service's field
    error on `total`.
  - **`ProjectStatusActions`:**
    - Driven by `projectStatusActions(status, { canActivate, canComplete })`.
    - A disabled action shows its reason as text tied to the button with
      `aria-describedby`.
    - Cancel confirms through `ConfirmDialog`.
    - Results use `changeProjectStatus`. A `CONFLICT` shows in the announced
      region.
  - **`DeleteProjectButton`.** Draft only. Confirms, calls `deleteProject`,
    then `router.push("/dashboard/projects")`.
  - **Done when:** in the browser:
    - A balanced draft activates.
    - An unbalanced draft shows Activate disabled with its reason.
    - An active project pauses and resumes, and cancels after confirmation.
    - A draft deletes and lands on the list.
    - A completed or cancelled project shows locked details.
    - Lint and typecheck pass.

- [x] **8. Client's projects on client detail**
  - `src/app/dashboard/clients/[clientId]/page.tsx`:
    - Load `listClientProjects` in the same `Promise.all`.
    - Add a Projects section with a heading and an `aria-labelledby` link,
      reusing `ProjectTable` or a compact list. When there are none, say "No
      projects yet."
    - Non-archived clients also get "New project" linking to
      `/dashboard/projects/new?clientId=<id>`.
  - **Done when:** in the browser, client detail lists that client's projects
    only. New project preselects the client and its currency. An archived
    client shows its projects without the link. Lint and typecheck pass.

- [x] **9. Development migration and browser verification**
  - **Live, separate approval.** Name the target first: project
    `snowy-voice-62561189`, branch `development`, from
    `blueprint/database-setup.md`. Show
    `prisma/migrations/20261009120000_projects_and_milestones/migration.sql`.
    After an explicit yes, run `npx prisma migrate status`, then
    `npm run db:migrate`, then `npx prisma migrate status` again. If it fails,
    stop and follow the failed-migration procedure, each command with its own
    approval.
  - Record the result under a new "Applied" heading in
    `blueprint/database-setup.md`, and update
    `blueprint/dashboard-architecture.md` §19 with the shipped routes and any
    deviations.
  - **Browser verification** with the dev server against `development`, at
    1280px and 390px, in dark and light:
    - every screen and its empty, loading, error and not-found states
    - keyboard-only creation and plan editing
    - no horizontal scroll at 390px
    - screenshots in the review packet
  - **Done when:** `migrate status` reports up to date. The browser evidence
    covers each step's done-when. Final gate: `npm run lint`,
    `npx tsc --noEmit`, `npm test`, `npm run test:integration` and
    `npm run build` all pass, with public routes still static or SSG and the
    dashboard routes dynamic.

## Files / areas

- New:
  - `src/lib/dashboard/projects.ts`
  - `src/server/queries/projects.ts`
  - `src/app/dashboard/projects/`: `page.tsx`, `loading.tsx`, `error.tsx`,
    `new/page.tsx`, `[projectId]/page.tsx`, `[projectId]/not-found.tsx`,
    `[projectId]/plan/page.tsx`, `[projectId]/settings/page.tsx`
  - `src/components/dashboard/projects/`: `ProjectTable`, `ProjectForm`,
    `ProjectHeader`, `ProgressPair`, `PaymentPlanTable`, `PlanEditor`,
    `MilestoneRow`, `PlanPresetPicker`, `ProjectStatusActions`,
    `DeleteProjectButton`
  - `src/components/dashboard/shared/`: `StatusBadge`, `ProgressMeter`,
    `MoneyAmount`, `ConfirmDialog`
  - Tests: `tests/lib/dashboard/projects.test.ts` and
    `tests/integration/server/queries/projects.test.ts`
- Changed:
  - `src/lib/money.ts` (export `minorToInput`)
  - `src/lib/dashboard/navigation.ts`
  - `src/components/dashboard/shell/AppSidebar.tsx`
  - `src/server/revalidate.ts`
  - `src/app/dashboard/clients/[clientId]/page.tsx`
  - `tests/lib/money.test.ts` and `tests/lib/dashboard/navigation.test.ts`
  - `blueprint/database-setup.md` and `blueprint/dashboard-architecture.md`
- Added during the build:
  - `src/server/queries/load-project.ts`: the shared project-or-404 loader for
    the project page, the plan editor and settings.
  - `src/components/dashboard/shared/NativeSelect.tsx`.
  - `src/components/dashboard/projects/MilestoneForm.tsx`: used for both adding
    and editing milestones.
  - `src/components/dashboard/projects/ProjectStatusBadge.tsx`.
  - `ProjectForm.tsx` exports `NewProjectForm` and `ProjectDetailsForm`, which
    share one details section.
  - Page tests: `tests/app/dashboard/projects/pages.test.tsx`. The client page
    tests are extended for the projects section.
  - Form helpers in `src/lib/dashboard/projects.ts`: `newProjectFormSchema`,
    `toProjectInput`, `milestoneFormSchema`, `toMilestoneInput` and
    `milestoneFormFields`. They keep the preset and the pricing fields flat in
    the form. Forms validate with them, then send the raw field text, because
    the 18a actions re-parse their input.
- Reused unchanged: `src/actions/projects.ts`, `src/actions/milestones.ts`,
  `src/server/services/*`, `src/lib/validation/{project,milestone,money}.ts`,
  `src/lib/finance.ts`, `src/lib/payment-plan.ts`, `src/lib/state/project.ts`,
  `src/lib/permissions.ts`, `Field`, `EmptyState`, `AuthFeedback`.

## Data / contracts

- **No schema, migration or action changes.** The actions keep the 18a contract,
  `ActionResult<{ projectId } | { projectId, milestoneId }>`, with codes
  `VALIDATION` (`fieldErrors`), `NOT_FOUND`, `CONFLICT`, `UNAUTHENTICATED` and
  `UNEXPECTED`.
- **Money:**
  - Queries return integer minor units as `number`. They are converted from
    `bigint` through `minorFromDb`.
  - Pages format money on the server with `formatMoney` and pass strings to
    client components.
  - Edit forms receive `minorToInput` strings. A client component never parses,
    sums or allocates money.
  - Figures are always within one project's currency, and list rows show each
    project's own currency. Nothing sums across currencies.
- **Percentages:** stored as basis points, shown via `formatPercent`, and
  prefilled via `bpsToPercentInput`.
- **URL shapes:**
  - `/dashboard/projects?status=<draft|active|on_hold|completed|cancelled>`
  - `/dashboard/projects/new?clientId=<uuid>`
  - `/dashboard/projects/<uuid>`, plus `/plan` and `/settings`
  - Any other `status` value means All. An unknown `clientId` is ignored.
- **Dates:** `YYYY-MM-DD` inputs, through `calendarDateFromDb` and
  `calendarDateToDb`. They are displayed with `formatDate`.
- **Status display:** every status shows its text label. Colour only
  reinforces it.

## Testing

- **Unit (`npm test`):** money input round trip, filter parsing, labels, percent
  formatting, form-value mapping, status action availability, navigation.
- **Integration (`npm run test:integration`, local PostgreSQL):** query owner
  isolation, filter, ordering, plan summary, `canActivate` and `canComplete`,
  and the picker excluding archived clients. The 18a action and service tests
  keep covering mutations.
- **UI:** exempt from unit tests. Each step's done-when names browser evidence
  from the dev server, collected in step 9. No Browser tests command exists, so
  nothing claims automated browser coverage.
- **Gate:** lint, typecheck, unit, integration and build, as in the Build loop.

## Notes for the AI

- **Authorization:**
  - Every page calls `requireOwner()` itself; the layout check does not count.
  - Every query is owner-scoped in SQL.
  - Ids from the URL go only through the owned loaders, whose `NotFoundError`
    becomes the scoped 404 with no existence leak.
  - Never pass a client-supplied id to a query without that loader.
- **Rendering:** user text (names, descriptions, client names) renders through
  React escaping only. No `dangerouslySetInnerHTML`. Descriptions use
  `whitespace-pre-line`.
- **Page titles** are static, so a project name never reaches the tab title,
  matching the 17b decision.
- **Not-found status:** a not-found project page responds with HTTP 200 because
  `loading.tsx` streams first. This is the same accepted trade-off as clients,
  and every dashboard route is noindex.
- **Dashboard look:** no Motion and no entrance animation. Touch targets are at
  least 44px (`min-h-11`). Use the `workspace-*` text sizes and surfaces from
  the client screens.
- **18a defaults kept:**
  - "Fixed amounts" has no deposit.
  - N runs from 1 to 10.
  - The client is fixed after creation.
  - Name limits are 120 characters.
  - Change any of these only through a reviewed plan change, not in this
    feature.
- **Stale 18a note:** `src/server/services/projects.ts` has a "Feature 20" note
  about the currency lock. Leave it.
- **Live operations:** step 9's migration is the only one. Never use
  `prisma db push`, `migrate dev`, or Studio against Neon.

## Verification evidence

**Live migration, step 9.** On 2026-10-09 `npm run db:migrate` applied
`20261009120000_projects_and_milestones` to `development`
(`ep-rough-darkness-a7rwukh4`). `migrate status` then reported the database
schema up to date. `production` is untouched.

**Browser pass.** Run with the dev server against `development`, signed in as
the owner, through Playwright. Screenshots are in the git-ignored
`.playwright-mcp/` folder: `18b-project-dark-1280.png`,
`18b-list-light-1280.png`, `18b-project-light-390.png`,
`18b-plan-light-390.png` and `18b-settings-dark-390.png`. Checked:

- **Projects list:**
  - The empty list and all six tabs. Cancelled shows only the cancelled
    project.
  - Rows show status as text and the plan's unallocated amount.
- **New project:**
  - Client-side errors are linked and announced, and the first invalid field
    is focused.
  - Choosing a client sets its currency.
  - A server preset error (0.02 split into 3) lands on the count field.
  - The 30% + 3 preset gives 15,000 + 11,665 + 11,665 + 11,670.
  - `?clientId=` preselects the client and its currency.
  - User text is escaped everywhere.
- **Plan editor:**
  - Over-allocation shows on the percentage and amount fields.
  - Keyboard reorder works, and the deposit cannot move.
  - Delete, cancel and restore work, and the summary updates after each.
  - A mixed plan balances at exactly 50,000.00.
  - The preset and deposit option appear only for an empty draft.
- **Settings:**
  - Activate, pause, resume and cancel work. Activate and Complete are
    disabled with their reasons linked through `aria-describedby`.
  - A total too small for the plan shows an error on `total`. 60,000.00
    saves, and the percentages re-allocate (18,000 and 13,998).
  - A deleted draft returns to the list.
  - A cancelled project's details are locked, and its plan URL redirects.
- **Client detail:** lists the client's projects and links to New project
  with the client preselected.
- **Not found:** a random UUID and malformed ids on all three project routes
  show "Project not found".
- **Layout:** no horizontal page scroll at 390px, and every target is at
  least 44px. The plan table scrolls inside its own focusable region, like
  the clients table.

**Defects the browser pass found and fixed.** Several actions removed or
replaced the button that was clicked, which dropped focus to `<body>`:

- After a delete, focus now goes to the Milestones heading.
- After a cancel, focus goes to the row's Restore button. After a restore, it
  goes to the row's Edit button.
- After an inline edit is saved or cancelled, focus returns to the row's Edit
  button.
- After a status change, focus goes to the Status heading, and the change is
  announced in a live region that stays mounted. A first version re-mounted
  the region when the action list emptied.

The deposit row no longer reads "Deposit Deposit".

**Left in place:**
- Another owner's id is covered by integration tests only, because the live
  database has a single owner.
- `QA project Shop rebuild <b>QA</b>` (active) and `Cancelled QA` (cancelled)
  remain on `development` for manual review.
- The console showed only the existing server-side `pg` sslmode warning and
  dev-server CSS preload notices.

## Open questions

None block implementation. The defaults below can change cheaply at review:

1. **Plan table share:** fixed milestones show "Fixed" rather than a derived
   share of the total.
2. **Projects list order:** newest first, with an All tab as the default.

## Independent review

**Status:** passed
**Target commit:** 0d03b985f45850bfd365d7b22cb688733284168b
**Base commit:** c84dea4e1be86a510eacea803b56aede40d23d05
**Base ref:** main
**Spec hash:** 922fedf3e368ce3c3205a898c658b46d1f409e11013ab6134300b864c1f848ec
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-09T03:14:46Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-09T03:17:25Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Commands

- `npm run lint`: pass
- `npx tsc --noEmit`: pass
- `npm test`: pass (52 files, 1002 tests)
- `npm run test:integration`: pass (8 files, 88 tests, local PostgreSQL)
- `npm run build`: pass (public routes static or SSG; every `/dashboard/projects` route dynamic)

### Evidence

- Freshness confirmed before review: HEAD, `git merge-base main HEAD`, spec SHA-256 and a working tree differing only in `blueprint/context/review.md` all match the request.
- Whole `c84dea4e1be86a510eacea803b56aede40d23d05..0d03b985f45850bfd365d7b22cb688733284168b` delta read (45 files): pages, components, queries, helpers, tests and blueprint docs.
- Authorization: every new page calls `requireOwner()` itself; `listProjects`, `listProjectClients` filter `ownerId` in the query; `listClientProjects` and `getProjectView` go through `ownedClient`/`ownedProject` (malformed id rejected before SQL); `?clientId=` is matched against the owner's active-client list; only `NotFoundError` becomes the scoped 404 and other errors reach `error.tsx` (`load-project.ts`).
- Money: queries convert through `minorFromDb`; all `formatMoney` calls are in server components or pages; client components receive pre-formatted strings and raw input text only; list rows and figures use each project's own currency, with no cross-currency sum.
- Plan rules: move-button guards, `canAddDeposit` and `canBeDeposit` match `reorderMilestones`, `createMilestone` and `updateMilestone` in `src/server/services/payment-plan.ts` (deposit counted even when cancelled, always first); `canActivate`/`canComplete` match `changeProjectStatus` guards.
- Rendering: no `dangerouslySetInnerHTML` under `src/app/dashboard` or `src/components/dashboard`; descriptions use `whitespace-pre-line`; titles are static.
- Accessibility contracts checked in code: labelled `role="progressbar"` meters with text percentages, tab nav `aria-label`/`aria-current`, disabled status actions tied to reasons by `aria-describedby`, announced feedback regions, focus restoration after reorder, delete, cancel, restore, edit and status change.

### Findings

- F-36 [P3] open: `canComplete` true branch has no integration test (non-blocking)

### Remaining risk

- Browser behaviour (focus moves, announcements, 390px layout, both themes) was reviewed in code only; this reviewer did not run the app, and no Browser tests command exists.
- Another owner's ids on the live pages are covered by integration tests only, as the spec records.
- Earlier P3 entries F-24, F-30, F-33, F-34 and F-35 are outside this delta's changed files and were not re-examined; none blocks `/complete`.
