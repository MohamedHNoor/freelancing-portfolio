# Feature: Client screens

**From build-plan:** feature 17b

**Branch:** feature/client-screens

**Status:** verified

## Goal

Give the owner working client screens in the private dashboard, built on 17a's
actions and queries: a clients list with an archived view, new and edit forms,
a client detail page with its activity, and archiving with confirmation. Make
Clients a real destination in the workspace navigation. Apply 17a's migration
to the Neon `development` branch, and prove the flows in a real browser against
that branch.

## Design reference

There is no client-screen mockup. Reuse the dashboard shell's tokens and
density: `workspace-ui`, `workspace-surface`, `text-workspace-*`,
`max-w-workspace`, the `success`/`info`/`danger` soft tokens, and the existing
`Button`, `Input`, `Label`, `Textarea` and `Badge`. `prototypes/create.html`
(the client details card) is the closest reference for the form's grouping and
density. Architecture §21 applies: no entrance motion, status always as text
with colour as reinforcement, desktop-first with the sidebar collapsing to the
existing sheet on mobile.

## In scope

- Workspace navigation:
  - Clients becomes a link with `aria-current` on `/dashboard/clients` and every
    nested route.
  - Overview is current only on `/dashboard`.
  - The topbar breadcrumb names the current section.
  - The mobile sheet's description is updated.
  - Projects, Payments and Settings stay under "Coming soon".
- The overview page's "coming soon" copy now points to Clients.
- Routes, all dynamic and noindex through the existing dashboard layout:
  - `/dashboard/clients`, with `?view=archived`
  - `/dashboard/clients/new`
  - `/dashboard/clients/[clientId]`
  - `/dashboard/clients/[clientId]/edit`
- Segment `loading.tsx` and `error.tsx` for `clients/`, and a scoped
  `not-found.tsx` for `[clientId]/`.
- A shared accessible `Field` wrapper and the `ClientForm` client component for
  both create and edit.
- Archiving through a confirmation dialog (shadcn `alert-dialog`).
- Server-side date formatting in `Pacific/Auckland` (`src/lib/dates.ts`).
- Applying the committed migration to the Neon `development` branch, with
  separate approval.
- Browser verification, a docs update and the final gate.

## Out of scope

- Delete, unarchive, search, sorting controls and pagination. None is in the
  build plan, and 17a has no service for them.
- Projects on the client detail page, and per-currency totals (features 18
  and 22).
- Stripe customer sync (feature 20).
- Applying the migration to `production`, and any Vercel or Neon setting change.
- A Browser tests harness. Run `/browser-tests` separately if wanted.
- F-30 (session refresh cost) and F-33 (activity index) remain ledger items.

## Build loop

`workflow.stepReview` is `feature`: build every step, keeping each one working,
then present one review packet. `workflow.checkpointCommits` is `disabled`.
`/complete` creates the final feature commit. When the steps and the final gate
pass, stop and hand over; the owner runs `/check` and `/complete`.

## Build steps

- [x] **1. Pure helpers: dates, list view, navigation**
  - `src/lib/dates.ts`:
    - `formatDate(date)` returns `"9 Oct 2026"`.
    - `formatDateTime(date)` returns `"9 Oct 2026, 2:05 pm"`.
    - Both use `Intl.DateTimeFormat("en-NZ", { timeZone: "Pacific/Auckland" })`
      and assemble the result from `formatToParts`, so the output does not
      depend on the machine's locale or timezone.
    - Update the file's header comment, which currently rejects `Intl`, to say
      why an explicit locale and timezone are safe here.
  - `src/lib/dashboard/clients.ts`:
    - `parseClientView(value)` returns `"archived"` only for the exact string
      `"archived"`, and `"active"` for anything else, including arrays.
    - `clientDisplayName(client)` returns `companyName ?? name`.
    - `clientFormValues(client)` maps a stored client to `ClientInput`, turning
      nulls into `""`.
    - `addressLines(client)` returns the non-empty address parts in display
      order.
  - `src/lib/dashboard/navigation.ts`:
    - `WORKSPACE_NAV` lists Overview at `/dashboard` and Clients at
      `/dashboard/clients`.
    - `isNavItemCurrent(pathname, href)`: exact match for `/dashboard`; exact
      match or a nested segment for every other item (`/dashboard/clientsx` does
      not count).
    - `workspaceSectionLabel(pathname)` returns the section's label.
  - Tests: `tests/lib/dates.test.ts` (extended),
    `tests/lib/dashboard/clients.test.ts`, `tests/lib/dashboard/navigation.test.ts`.
  - **Done when:** `npm test` passes, including:
    - a DST-start, a DST-end and a UTC-midnight-crossing instant for both
      formatters
    - noon and midnight shown as `12:00 pm` and `12:00 am`

- [x] **2. Workspace navigation and overview copy**
  - `src/components/dashboard/shell/WorkspaceNav.tsx` (client leaf, using
    `usePathname`): renders `WORKSPACE_NAV` with `aria-current="page"` and the
    current-item styling from `isNavItemCurrent`, and calls `onNavigate`. It
    follows the pattern of `src/components/layout/NavLink.tsx`.
  - `AppSidebar.tsx` stays a server component. It renders `WorkspaceNav` plus
    the "Coming soon" list without Clients.
  - `Topbar.tsx`: the breadcrumb shows `workspaceSectionLabel(usePathname())`.
    The sheet description reads "Open the overview or your clients. More
    workspace tools are coming soon."
  - `src/app/dashboard/page.tsx`: replace the "Client, project and payment tools
    are coming soon" paragraph and the portfolio button. The card says client
    records are ready and project and payment tools are coming. Its primary
    button links to `/dashboard/clients`, with "View public portfolio" kept as a
    secondary link. The "Your private workspace" eyebrow stays.
  - **Done when:** `npx tsc --noEmit`, `npm test` (including the existing
    `tests/app/dashboard/authorization.test.tsx`) and `npm run lint` pass.

- [x] **3. Clients list**
  - `src/app/dashboard/clients/page.tsx` (async `searchParams`):
    - Calls `requireOwner()`, then `parseClientView`, then
      `listClients(ownerId, { archived })`.
    - Shows the h1 "Clients", a "New client" button, and Active/Archived view
      links. The links are `<Link>`s to `/dashboard/clients` and
      `?view=archived`, with `aria-current="page"` on the current view.
  - `src/components/dashboard/clients/ClientTable.tsx` (server):
    - A semantic `<table>` with a `<caption>` (`sr-only`).
    - Columns: Client (display name as a link to the detail page, with the
      contact name below it when a company exists), Email, Country, Currency,
      and Archived (date) in the archived view only.
    - The table sits in a focusable, labelled `role="region"` scroll container,
      so a phone gets no page-level horizontal scroll.
  - `src/components/dashboard/shared/EmptyState.tsx` (server):
    - Active, empty: "No clients yet", one sentence, and a "New client" button.
    - Archived, empty: "No archived clients", with a link back to the active
      list.
  - `src/app/dashboard/clients/loading.tsx`: a skeleton in the existing
    `dashboard/loading.tsx` style, with `role="status"` and sr-only text
    "Loading clients…".
  - `src/app/dashboard/clients/error.tsx`: the existing `ErrorPanel` with
    `retry`.
  - Tests: `tests/app/dashboard/clients/pages.test.tsx`, in the
    `authorization.test.tsx` pattern with `@/server/queries/*` mocked. They
    check that:
    - the page calls `requireOwner` and passes the owner id and the parsed view
      to `listClients`
    - `?view=bogus` lists active clients
    - both empty states render
    - client text is rendered escaped (a `<script>` name appears as text)
  - **Done when:** the page tests and `npx tsc --noEmit` pass.

- [x] **4. Client form and the new-client page**
  - `src/components/dashboard/shared/Field.tsx`:
    - Renders a label, an optional hint, an error with an id, and a "required"
      marker shown visually and in text.
    - Takes its control through a render prop that receives `id`,
      `aria-describedby` and `aria-invalid`, so inputs, the native `<select>`
      and `<Textarea>` share one pattern.
    - It mirrors `AuthField`, which stays unchanged.
  - `src/components/dashboard/clients/ClientForm.tsx` (client):
    - react-hook-form with `zodResolver(clientInputSchema)`. Its `mode` and the
      `onSubmit` structure match `LoginForm`.
    - Three `fieldset`/`legend` groups:
      - Contact: name, email, phone, company
      - Billing: default currency, country code, address lines 1 and 2, city,
        region, postal code
      - Notes
    - Currency is a native `<select>` with an empty "Choose a currency" option
      and the five currencies labelled by code and name. Add `CURRENCY_NAMES`
      to `src/lib/money.ts`.
    - Country code has the hint "Two letters, such as NZ".
    - `autoComplete` values: `name`, `email`, `tel`, `organization`,
      `address-line1`, `address-line2`, `address-level2`, `address-level1`,
      `postal-code`, `country`.
    - Submitting calls `createClient(values)`, or `updateClient(clientId,
      values)` in edit mode, inside `useTransition`. The submit button is
      disabled while pending and shows a spinner (`AuthSubmitButton`), and the
      form sets `aria-busy`.
    - **Success:** `router.push` to `/dashboard/clients/<id>`, then
      `router.refresh()`.
    - **Failure:** `useAuthFeedback().reportFailure` with the visible field list
      in focus order. Field errors are set and the first one gets focus. With no
      field errors, the role=status summary shows the action's message
      (`NOT_FOUND`, `CONFLICT`, `UNAUTHENTICATED`, `UNEXPECTED`) and takes focus.
      Feedback clears on the next submit.
    - A "Cancel" link goes back to the list (create) or the detail page (edit).
  - `src/app/dashboard/clients/new/page.tsx`: calls `requireOwner()`, shows the
    h1 "New client" and renders the form in create mode. Metadata title
    "New client".
  - **Done when:**
    - `npx tsc --noEmit` and `npm run lint` pass.
    - The page test proves `requireOwner` runs.
    - Browser evidence for the form comes in step 8.

- [x] **5. Client detail and edit pages**
  - `src/app/dashboard/clients/[clientId]/page.tsx` (async `params`):
    - Calls `requireOwner()`, then `getClient` and `listClientActivity`. A
      `NotFoundError` from either calls `notFound()`; anything else reaches
      `error.tsx`. 17a's loader already treats a malformed id as not found.
    - Shows the h1 with the display name, and an "Archived" badge (text) with
      "Archived on <date>" when archived.
    - A `<dl>`: contact name, email (a `mailto:` link), phone, company, country,
      default currency, address (one line per part), and notes. Notes render as
      plain text with `whitespace-pre-line`. Empty values show "Not provided".
    - Actions for active clients only: "Edit client" (a link) and the archive
      button from step 6. An archived client shows a notice in their place:
      "Archived clients can't be edited."
    - Activity, as an `<ol>` newest first: each summary with a `<time
      dateTime={iso}>` showing `formatDateTime`. "No activity yet" when empty.
      "Showing the 50 most recent changes." when the list reaches
      `CLIENT_ACTIVITY_LIMIT`.
    - Metadata title "Client". The client's name is never put in metadata.
  - `src/app/dashboard/clients/[clientId]/edit/page.tsx`: calls
    `requireOwner()`, then `getClient`. Not found calls `notFound()`. An
    archived client calls `redirect` to its detail page. Otherwise it shows the
    h1 "Edit client" and `ClientForm` in edit mode with
    `clientFormValues(client)`. Metadata title "Edit client".
  - `src/app/dashboard/clients/[clientId]/not-found.tsx`: "Client not found",
    one sentence, and a link to the clients list.
  - Tests, added to `pages.test.tsx`:
    - Both pages call `requireOwner`.
    - A `NotFoundError` from the query calls `notFound()`; owner B's id and a
      malformed id surface the same way.
    - An unexpected error propagates.
    - The edit page redirects for an archived client.
    - The detail page hides the edit and archive actions for an archived
      client.
    - Notes and the name render as escaped text.
  - **Done when:** the page tests, `npx tsc --noEmit` and `npm test` pass.

- [x] **6. Archive with confirmation**
  - `npx shadcn@latest add alert-dialog`. It must use the already-installed
    `radix-ui`; confirm no new runtime dependency lands in `package.json`.
  - `src/components/dashboard/clients/ArchiveClientButton.tsx` (client):
    - An outline "Archive client" button opens the alert dialog.
    - Title: "Archive <display name>?"
    - Description: "Archived clients move to the Archived list and can no
      longer be edited. There is no way to restore them yet."
    - Buttons: "Cancel" (default focus) and "Archive client".
    - Confirming calls `archiveClient(clientId)` in a transition. Both buttons
      are disabled while pending, and the confirm button shows a spinner.
    - **Success:** close the dialog, call `router.refresh()`, and move focus to
      the page's status region, which announces "Client archived."
    - **Failure:** the dialog stays open and shows the action's message in
      `role="alert"`.
    - Escape and Cancel close the dialog without changes and return focus to
      the trigger.
  - **Done when:** `npx tsc --noEmit` and `npm run lint` pass, and `git diff
    package.json` shows no new dependency. Browser evidence comes in step 8.

- [x] **7. Apply the migration to the Neon `development` branch** (live; each
  command needs the owner's separate approval)
  - Confirm, without printing any connection string, that `.env`'s
    `DATABASE_URL` points at the `development` branch (`br-royal-darkness-a7qoz708`)
    and not `production`. Compare only its endpoint id against the branch's
    endpoint through the Neon MCP. Stop if it is production or unknown.
  - The owner adds the `development` branch's direct URL as
    `DATABASE_URL_UNPOOLED` to `.env.local`. The agent never reads it back or
    prints it.
  - With approval:
    1. `npx prisma migrate status`, which should report the one pending
       migration.
    2. `npm run db:migrate`.
    3. `npx prisma migrate status` again.
  - Through the Neon MCP (read-only): `development` has `clients`,
    `activities` and `_prisma_migrations`, and `production` is unchanged.
  - Record the target, migration name, result and date in
    `blueprint/database-setup.md` under the named-target handoff.
  - **Done when:**
    - `migrate status` reports the database schema is up to date on
      `development`.
    - The table check matches.
    - `production` has no new tables.

- [x] **8. Browser verification** (the owner starts `npm run dev` and signs in
  as the owner in the automation browser; never ask for the password in chat)
  - With Playwright (MCP), at 1280×800 and 390×844, in dark and light themes,
    record screenshots plus console and failed-request checks for each of
    these:
    1. The active list, empty.
    2. Create, submitted empty: field errors appear with focus on Name and are
       announced. Then a valid client with a company is created and the browser
       lands on its detail page.
    3. A second client without a company.
    4. The list shows both, ordered by name.
    5. Edit one field: the detail page shows it, and the activity lists
       "Updated client …".
    6. The archive dialog: keyboard only (Tab to open, Escape cancels), then
       confirm. The status announces it, the badge and notice show, and the
       actions are gone.
    7. The archived view lists the client with its date. Opening
       `/dashboard/clients/<archived id>/edit` redirects to the detail page.
    8. `/dashboard/clients/not-a-uuid` and a random uuid both show the scoped
       not-found page.
    9. The sidebar shows `aria-current` on Clients and the breadcrumb reads
       "Clients". The mobile sheet navigates to Clients.
  - Run `axe-core` (the installed devDependency, injected through `evaluate`)
    on the list, new, detail and edit routes in both themes.
  - Use clearly fictional names. These records stay in the `development` branch
    as archived or active test data.
  - **Done when:**
    - Every item above has a screenshot or observed output.
    - axe reports no violations.
    - No console errors or failed requests other than expected 404s for the
      not-found checks.

- [x] **9. Docs and final gate**
  - `blueprint/dashboard-architecture.md` §19 and §21: mark the client routes
    as shipped and note the deviations (no delete or unarchive; static
    metadata titles).
  - `blueprint/database-setup.md`: step 7's record.
  - **Done when:** `npx tsc --noEmit`, `npm run lint`, `npm test`,
    `npm run test:integration` and `npm run build` pass. The build table shows
    the four client routes as `ƒ` and every public route still static.

## Files / areas

- `src/lib/dates.ts`, `src/lib/money.ts` (`CURRENCY_NAMES`),
  `src/lib/dashboard/clients.ts`, `src/lib/dashboard/navigation.ts`
- `src/components/dashboard/shell/{AppSidebar,Topbar,WorkspaceNav}.tsx`
- `src/components/dashboard/shared/{Field,EmptyState}.tsx`
- `src/components/dashboard/clients/{ClientTable,ClientForm,ArchiveClientButton}.tsx`
- `src/components/ui/alert-dialog.tsx` (shadcn)
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/clients/{page,loading,error}.tsx`, `new/page.tsx`,
  `[clientId]/{page,not-found}.tsx`, `[clientId]/edit/page.tsx`
- `tests/lib/dates.test.ts`, `tests/lib/dashboard/*.test.ts`,
  `tests/app/dashboard/clients/pages.test.tsx`
- `blueprint/database-setup.md`, `blueprint/dashboard-architecture.md`,
  `.env.local` (owner-edited, never committed)

## Data / contracts

- **Consumed from 17a, unchanged:**
  - `createClient(raw)`, `updateClient(clientId, raw)`,
    `archiveClient(clientId)` return `ActionResult<{ clientId }>` with codes
    `VALIDATION`, `NOT_FOUND`, `CONFLICT`, `UNAUTHENTICATED` and `UNEXPECTED`.
  - `listClients`, `getClient`, `listClientActivity` and `NotFoundError`.
  - `clientInputSchema` and `ClientInput`.
- **Trusted actor:** pages take the owner id only from `requireOwner()`, and
  actions resolve it themselves. The browser sends only `clientId` and form
  values, and 17a validates both. No page passes an owner id to the client.
- **URL shapes:**
  - `/dashboard/clients[?view=archived]`. Any other `view` value means active.
  - `/dashboard/clients/new`
  - `/dashboard/clients/<uuid>`
  - `/dashboard/clients/<uuid>/edit`
  - Nothing else is read from the query.
- **Rendering:**
  - All client text renders as React text nodes, never
    `dangerouslySetInnerHTML`.
  - The `mailto:` href is built from the stored, already validated email.
  - Dates are formatted on the server and passed down as strings, with ISO
    values in `dateTime`.
- **Revalidation:** the actions already revalidate the list and detail paths.
  The client components still call `router.refresh()` after a successful
  mutation.
- **Accessibility contract:**
  - one h1 per page
  - labelled form controls with `aria-describedby` and `aria-invalid`
  - a visible and textual required marker
  - errors announced through focus or role=status
  - `aria-current` on the active nav item and the active view link
  - status as text plus colour
  - 44px minimum touch targets, matching the shell (`min-h-11`)

## Testing

- **Unit (`npm test`):** the date formatters, `parseClientView`,
  `clientDisplayName`, `clientFormValues`, `addressLines`, `isNavItemCurrent`,
  `workspaceSectionLabel`, and the server page tests listed in steps 3 to 5.
  The pages are rendered with `renderToStaticMarkup`, with the queries and
  session mocked.
- **Integration (`npm run test:integration`):** unchanged and still passing.
- **Browser:** step 8, through Playwright MCP against the dev server and the
  `development` branch. No Browser tests command exists, so this evidence is
  manual and not repeatable.
- The forms and the dialog are UI, so their behaviour rides on browser evidence
  rather than unit tests, per the testing standard.

## Notes for the AI

- Next 16: `params` and `searchParams` are promises in pages, so await them.
- Keep `AppSidebar` a server component. Only `WorkspaceNav` and `Topbar` read
  the pathname.
- Follow `LoginForm`, `useAuthFeedback` and `AuthFeedback` for the
  form-feedback mechanics, rather than writing a second pattern.
- Don't add Motion to the dashboard. Use the existing `workspace-reveal`
  utilities only for error text, as the auth forms do.
- Steps 7 and 8 need the owner: approval for every live command, a running
  dev server, and a signed-in owner session. If one is unavailable, stop and
  say which.
- Never print, log or commit `DATABASE_URL`, `DATABASE_URL_UNPOOLED` or any
  client record from the development database beyond the fictional test data.

## Independent review

**Status:** passed
**Target commit:** 02bb67b0e0557261bdb6d9a5f2c5f0d91031c95d
**Base commit:** 7319e70447c22c0ba5742fdd610befc1d14f9fee
**Base ref:** main
**Spec hash:** 1087729c55eb785dae961ff0a6cc6582e5122a96fda576e87d805735b043d566
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-08T14:39:01Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-08T14:42:30Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `npx tsc --noEmit`: pass
- `npm run lint`: pass
- `npm test`: pass (42 files, 705 tests)
- `npm run test:integration`: pass (3 files, 15 tests, local `portfolio_test`)
- `npm run build`: pass (four client routes `ƒ`, every public route `○`)
- `rg` for `.only`/`.skip`/`.todo` in `tests/`: none found

## Evidence

- Freshness confirmed before review: `HEAD` is the target, `git merge-base main HEAD` is the base, the spec SHA-256 matches, and the only dirty path is `blueprint/context/review.md`.
- Every new page (`clients/page.tsx`, `new/page.tsx`, `[clientId]/page.tsx`, `[clientId]/edit/page.tsx`) calls `requireOwner()` first and takes the owner id only from it; the browser sends only `clientId` and form values to 17a's `ownerAction` pipeline, which validates the uuid and ownership.
- Missing, malformed and foreign ids reach the scoped `notFound()`; other errors propagate to `clients/error.tsx`, which renders `ErrorPanel` without error details. Metadata titles are static, so no client name reaches `<head>`.
- All client text renders as React text nodes (no `dangerouslySetInnerHTML` in the delta); escaping is asserted in `tests/app/dashboard/clients/pages.test.tsx`. The `mailto:` href uses the Zod-validated stored email.
- `?view` is the only query value read; `parseClientView` accepts only the exact string `archived`.
- Dates are formatted server-side through `Intl.DateTimeFormat("en-NZ", { timeZone: "Pacific/Auckland", hourCycle: "h23" })` parts plus the literal month table; DST start/end, UTC-midnight crossing, noon and midnight are tested with literal expectations, and the transitions were checked against NZ's 2026 rules.
- `package.json` and `package-lock.json` are unchanged in the delta; `alert-dialog.tsx` uses the installed `radix-ui` and the project's existing `cn` import.
- Archive and edit flows rely on 17a's `CONFLICT` guard for archived clients as well as the edit page redirect; the dialog blocks close while pending and surfaces the action message in `role="alert"`.
- The HTTP 200 status for the scoped not-found page is a documented deviation (`blueprint/dashboard-architecture.md` §19), mitigated by the dashboard layout's `noindex`.

## Findings

- F-34 [P3] open: client detail page repeats the ownership lookup in series
- F-35 [P3] open: empty country cell renders a bare em dash
- Existing F-24, F-30 and F-33 are unaffected by this delta and left unchanged.

## Remaining risk

- The forms, archive dialog, focus moves and navigation `aria-current` are UI behaviour verified only by the builder's manual Playwright evidence (step 8); no Browser tests command exists, and this reviewer did not drive a browser, per the handoff limits.
- The Neon `development` migration (step 7) was not re-verified: live database commands are outside this reviewer's permissions.
- No Verify command or automatic GitHub checks exist; Lighthouse and transferred-weight budgets were not re-measured (the delta touches only dynamic dashboard routes and one shared CSS selector).
