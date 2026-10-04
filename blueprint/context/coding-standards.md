# Coding Standards

> Tuned by `/onboard` to the real stack: Next.js 16 App Router, React 19,
> TypeScript, Tailwind CSS v4, shadcn/ui, and Motion. The public site has no
> database and no auth. The private business dashboard (build-plan features 15 to
> 23) adds Neon Postgres through Drizzle, Better Auth, Stripe Checkout, and Resend;
> its rules are the Database and money, Auth and authorization, and Payments
> sections below, and its design is `blueprint/dashboard-architecture.md`. Update
> this file if the stack changes.

## TypeScript

- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define interfaces for all props, content models, and action results
- Use type inference where obvious, explicit types where helpful
- Content modules are typed against `src/types/content.ts`, so a malformed entry
  fails the build rather than rendering wrong

## React

- Functional components only
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks
- The React Compiler is enabled (`reactCompiler: true` in `next.config.ts`), so do
  not hand-write `useMemo` or `useCallback` unless profiling shows a real need

## Next.js

- App Router, server components by default
- Only use `'use client'` when needed: interactivity, hooks, browser APIs
- Keep client components small and push them to the leaves. The known client
  islands are the animation provider, theme toggle, mobile navigation, contact
  form, and project filter on the public site, and forms, the task list, dialogs,
  and the copy-link button in the dashboard
- Use Server Actions for form submission
- Every public route should be statically generated. Use `generateStaticParams`
  for dynamic routes and check the build output route table to confirm. The
  dashboard, sign-in, and payment routes are dynamic by design and must never
  make a public route dynamic
- No `proxy.ts` or middleware. Dashboard protection lives in the data access
  layer (see Auth and authorization)
- Use the metadata API for SEO, never hand-written `<head>` tags
- Use `next/font` for fonts and `next/image` with explicit `sizes` for images

## File Organization

- shadcn/ui components: `src/components/ui/` (owned by the CLI, avoid hand-edits
  beyond intentional restyling)
- Bespoke primitives: `src/components/primitives/ComponentName.tsx`
- Layout chrome: `src/components/layout/`
- Page sections: `src/components/sections/`
- Pages: `src/app/[route]/page.tsx`. From feature 15, public pages live under
  `src/app/(site)/`, sign-in pages under `src/app/(auth)/`, and the dashboard
  under `src/app/dashboard/`
- Server Actions: `src/actions/[feature].ts`
- Types: `src/types/[feature].ts`
- Content: `src/content/[collection].ts`
- Lib/Utils: `src/lib/[utility].ts`, and Zod schemas in
  `src/lib/validation/[feature].ts`
- Dashboard components: `src/components/dashboard/[area]/`. The existing
  `src/components/projects/` belongs to the public case studies
- Database schema: `src/db/schema/[table-group].ts`; migrations in `drizzle/`
- Server-only domain logic: `src/server/services/` (writes, transactions) and
  `src/server/queries/` (owner-scoped reads)
- Email templates: `src/emails/`
- Tests: `tests/[mirrored src path].test.ts`

## Naming

- Components: PascalCase (`ProjectCard.tsx`)
- Files: match the component name, or kebab-case for non-components
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Tailwind CSS for all styling
- Tailwind v4: CSS-first config via `@theme inline` in `src/app/globals.css`, no
  `tailwind.config.js`
- Design decisions belong in CSS variables in `globals.css`, not in one-off
  utility values scattered across components
- Use shadcn/ui for interactive primitives (button, input, select, sheet, form,
  toast). Add them with `npx shadcn@latest add <component>`
- The shadcn token values are overridden with the brand palette. Do not restore
  the stock neutral values, and re-check AA contrast when changing any token pair
- Compose with `cn` from `@/lib/utils`
- No inline styles
- Dark mode is the default; light mode is a supported option. Both palettes must
  be kept working

## Animation

- Motion only, imported as the code-split `m` component from `motion/react-m`
  inside the app-level `<LazyMotion features={domAnimation} strict>`
- `strict` is on deliberately: importing the full `motion` component is an error,
  because it silently undoes the code splitting
- Animate `transform` and `opacity` only, never layout properties
- Honour `useReducedMotion()` everywhere, collapsing distance-based motion
- Never animate the largest-contentful element in from `opacity: 0`; it delays LCP

## Content and data

- The public site has no database. All of its content is typed modules under
  `src/content/`, imported at build time. Public pages never query the database
- Components read content through helpers in the content layer, never by
  hard-coding copy inline
- A project with `isPlaceholder: true` is seeded example content and must never
  reach production

## Data Fetching and Actions

- Server components read content modules directly
- Client components submit through Server Actions
- Validate every input with Zod, using one schema shared by the client form and
  the server action
- Never trust client-supplied values in an action, including honeypot state

## Error Handling

- Use try/catch in Server Actions
- Return the `{ success, data, error }` pattern from actions
- Display user-friendly error messages; never leak provider errors to the UI
- Fail closed on missing configuration. A missing API key must produce a clear
  message and a working fallback, not a silent success

## Database and money

- Money is an integer number of minor units (`bigint` in Postgres) stored next to
  an explicit `currency`. Percentages are integer basis points (3000 is 30%).
  Never parse money with `parseFloat` or `Number()` and never do arithmetic on
  decimal values; go through `src/lib/money.ts`
- Never add amounts in different currencies. Every total is per currency
- Totals, paid, outstanding, and progress figures are derived by queries and pure
  functions on the server, never stored as counters and never computed in the
  browser. Client components receive values already formatted
- Format money and dates on the server only, with an explicit locale and the
  `Pacific/Auckland` timezone, so the output cannot depend on the machine
- Schema changes go through `npm run db:generate` and reviewed SQL in `drizzle/`.
  Never run `drizzle-kit push` against a shared Neon branch
- A write that touches more than one row runs in one transaction. Status changes
  are conditional updates (`WHERE status IN (...)`) so a lost race fails instead
  of overwriting
- Never call Stripe, Resend, or any other network service inside a database
  transaction
- Write the activity record in the same transaction as the change it describes
- Database, auth, Stripe, Resend, and server env modules start with
  `import "server-only"`, read their environment lazily, and never throw at module
  scope, because the static build imports them

## Auth and authorization

- Every dashboard page, query, and action calls `requireOwner()`. A layout check
  alone is not enough, because layouts do not re-run on client navigation
- Load records only through the owner-scoped loaders in `src/lib/permissions.ts`.
  A record that belongs to someone else raises the same `NotFoundError` as one
  that does not exist
- Validate every id from the browser as a uuid before use, including arguments
  bound with `.bind()`
- Auth forms use Server Actions calling Better Auth's server API, not the Better
  Auth browser client

## Payments

- Only the signature-verified Stripe webhook, or the owner's server-side Sync with
  Stripe, records money as received. The success redirect never writes anything
- Checkout amounts and currency always come from the database, never from the
  request
- Every Stripe create call and every Resend send carries an idempotency key, and
  webhook handling is idempotent through `stripe_events`
- Log Stripe's error type, code, and request id only; never log payloads, card
  details, or personal data

## Accessibility

Accessibility is one of the services this site sells, so the site has to pass its
own claim. Treat a violation as a bug, not a polish item.

- WCAG AA contrast on every token pair, in both themes
- One `h1` per page and a correct heading order
- Semantic landmarks, a skip link, and `aria-current` on the active nav item
- Everything operable by keyboard, with a visible focus ring
- Form errors wired to their inputs via `aria-describedby` and `aria-invalid`
- Respect `prefers-reduced-motion`

## Testing

The blueprint installs no test runner; testing is opt-in at the project level,
because the overlay can't know your stack. Adding unit testing is an explicit
setup task the AI can do through the normal workflow, either as a build-plan item
or with `/tests`. The setup should choose the stack-native runner, wire the
scripts or commands, add a small example test, and update the Commands section
of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  parsers, formatters, validators, id/slug builders, server actions. These have
  assertable inputs and outputs and real edge cases (empty, missing, malformed).
- **What not to test:** UI components and integration-level surfaces (render or
  export routes, anything driving a real browser or external service). Verify those
  with a screenshot and the build, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- An empty suite should fail, not pass, so "no tests ran" never looks like "passed".
- Test files live in `tests/`, mirroring the `src/` path of the module under
  test, so `tests/lib/theme.test.ts` covers `src/lib/theme.ts`. Import the
  module under test through the `@/` alias, not a relative path.
- Run them via the project's test command (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

Stack binding for this project: Vitest, with `vi.mock()` for external
dependencies (the Resend client) and `vi.useFakeTimers()` for time-dependent
logic. The in-scope logic here is the contact schema, content lookup helpers, and
slug handling; sections and layout are verified in the browser instead.

For the dashboard, the in-scope logic also covers money parsing, formatting, and
allocation, progress and payment-status derivation, the state machines, every Zod
schema, and the Stripe webhook mapping. From feature 17, services, ownership
checks, and the webhook route also need integration tests against a real
Postgres test branch (`npm run test:integration`), with Stripe mocked at
`src/lib/stripe.ts`. Every service that loads a record needs a test proving that
a second owner gets `NotFoundError`.

## Browser Verification

For UI and integration behavior, prefer real browser evidence over reading the
code and assuming it works.

- Browser automation is separately opt-in through `/browser-tests`. That setup
  reuses a compatible runner or prefers Playwright for supported projects, then
  documents the exact command as `Browser tests` in `AGENTS.md`.
- When `Browser tests` is declared, add focused coverage for stable behavioral
  done-whens when it is proportionate, and run the documented command during
  `/check`. Do not assume it proves visual fidelity, real authenticated-profile
  behavior, browser chrome, or another claim the test does not observe.
- If no Browser tests command is declared, do not add a runner silently in the
  middle of an unrelated feature. Use the available dev server, browser
  screenshots, build output, API output, or manual evidence instead.
- Browser tests are not part of the default Verify command or CI unless the user
  separately chooses that slower gate.
- Browser evidence is especially important for flows that click, type, submit,
  navigate, download files, render complex layouts, or depend on client-side
  state.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
