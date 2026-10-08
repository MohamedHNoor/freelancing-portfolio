# Freelance Portfolio - Project Overview

<!-- blueprint:source-hash 141ce66beefde798813f7eb28442c448be32e057b4195be2cf126a346a8a35fd -->

> A Wellington full-stack developer's portfolio converts search, LinkedIn and
> GitHub traffic into enquiries; a private dashboard runs won work and collects
> milestone payments through Stripe.

## Problem

Five projects have shipped to direct clients since August 2023, but public
reviews are absent. Case studies, engineering evidence and an accessible, fast
site establish capability and trust. Performance and accessibility are build
gates. Conversion: search/LinkedIn/GitHub → portfolio → case study → Start a
Project → enquiry. Agreed work needs clients, projects, tasks and milestone
payment plans together, with deposits (typically 30 or 50 percent), and work
completed, money requested and money received kept distinct.

## Users

The market is New Zealand, Australia and international; state Wellington
plainly. Working with clients across all three is true (owner, 2026-10-07), but
never name a client or location the work cannot back up. Visitors often arrive cold on
mobile and want direct contact with the developer.

| User | Needs |
|---|---|
| Businesses | Credible websites/custom software, reliability and communication |
| Startups | MVP-to-production engineering, auth, tenant isolation, payments/tests; travel-platform evidence |
| Agencies | Figma-to-production and white-label delivery; no agency engagement claimed |
| Entrepreneurs | Frontend-to-backend technical delivery |
| Recruiters/managers | Standalone resume and code-quality evidence |
| Developer/owner | The only dashboard account; clients, projects, plans, tasks, payments |
| Paying clients | No accounts; request email → private pay page → Stripe Checkout |

## Features

Order/progress: `blueprint/build-plan.md`. Detailed dashboard contracts:
`blueprint/dashboard-architecture.md`. Features 1–15 are checked complete.

1. **Design system and app shell** — tokens, font trio, navigation, themes.
2. **Content layer** — typed content used by sections/routes.
3. **Hero and about** — positioning, availability, narrative.
4. **Services** — four offerings, scope, timelines, engagement model.
5. **Skills and experience** — technologies by purpose with usage evidence; timeline.
6. **Selected projects and index** — outcome cards; service/technology filtering.
7. **Case study pages** — ten-part static pages. **Headline public feature.**
8. **Resume** — standalone A4 print layout; downloadable CV when supplied.
9. **Section detail pages** — home summaries link to full routes.
10. **Contact** — shared validation, Server Action, Resend, email fallback.
11. **SEO and social sharing** — metadata, canonicals, sitemap, robots, social images, structured data.
12. **Accessibility/performance** — keyboard/screen readers, axe, reduced motion, Lighthouse/budgets.
13. **Deployment readiness** — Vercel config, environment, smoke checks.
14. **Real projects replace placeholders** — TravelGrid Africa/portfolio; deploy gate cleared.
15. **Site and dashboard separation** — complete: static public `(site)` routes,
    document/fonts/theme root, marketing Motion/skip link in SiteChrome, standalone
    resume skip link, robots exclusions and exact Stripe Checkout form-action origin.
16. **Owner sign-in** — parent stays unchecked until three sequential leaves finish:
    - **16a Database foundation** — lazy environment, Neon connection, Prisma with
      offline client generation; no exposed auth routes (moved from Drizzle by
      `fix/prisma-neon-auth`).
    - **16b Owner authentication** — Managed Better Auth per branch with sign-up
      closed, owner account, verification/reset emails via Resend SMTP, sessions,
      server actions and owner-only authorization tests.
    - **16c Auth screens and dashboard shell** — accessible forms, protected
      navigation, loading/error states and browser verification in the existing design system.
17. **Clients** — CRUD/archive/list, integer money, activity log.
18. **Projects/payment plans** — percentage/fixed/mixed milestones, upfront deposit,
    exact balance before activation, separate work/payment progress. **Headline dashboard feature.**
19. **Tasks/milestone completion** — statuses, reorder, computed progress, ready state,
    manual completion/reopening, activity timeline.
20. **Payment requests/Checkout** — stable pay link, itemized request/invoice number,
    Review & Pay, manual reminders, cancellation/retry.
21. **Payment confirmation** — verified idempotent webhook, refunds/disputes,
    owner notifications, read-only success page, server-side Sync with Stripe.
22. **Overview/payments** — per-currency totals, pending requests, deadlines,
    recent activity, filterable payment list.
23. **Hardening/launch** — 2FA, sessions, monitoring, E2E, reconciliation, backups,
    production setup; scope gap below remains to confirm.

Later candidates: writing/genuine testimonials. Site exclusions: blog, CMS,
analytics dashboards, false testimonials/logos and pricing beyond enquiry budget
brackets. Dashboard v1 excludes client accounts/portal, PDF invoices, partial
payments, automatic reminders, storage, currency conversion and Stripe Connect.
`prototypes/client.html` is an exploration, not a client-portal requirement.

## Data model

### Public site: content modules, no database

All public content is typed TypeScript under `src/content/`, imported at build
time so every public route is statically generated; types live in
`src/types/content.ts`. Public pages never query the database, and content
invariants checked at import fail the build rather than render wrong.

> `Project`, `CaseStudySection` and `Resume` are locked shapes read by the home
> section, the index, the case study route, social images, structured data and
> the resume. Treat changes as breaking.

- **Profile** (single record) - `name`, `role`, `headline`, `headlineEmphasis`
  (the phrase the hero highlights; must appear in `headline`), `shortBio`, `primaryStack`, `longBio` (string[]), `availability`
  ({ `status`: available | limited | unavailable, `detail` }), `location`,
  `serviceArea`, `portrait` and `heroShowcase` (ImageAsset: `src`, `alt`,
  `width`, `height`), `links` ({ `email`, `github`, `linkedin`, `cv` }; empty
  means not supplied)
- **Service** - `slug` (business-websites | web-applications | saas-development
  | figma-to-production), `name`, `summary`, `lists` (one or two { `label`,
  `items` }), `cta`, `enquiryType` (the contact project type it preselects),
  `typicalTimeline`? (duration only, never a price), `order`
- **Point** - `title`, `detail`: value points, audiences, reasons, process steps
  and milestones
- **SkillGroup** - `id`, `label`, `skills` ({ `name`, `context`, `icon`?,
  `featured`?, `resume`? }[]); `context` names where it was used, and there is
  no proficiency value of any kind
- **Role** - `id`, `company`, `title`, `start` (`YYYY-MM`), `end` (`YYYY-MM` |
  present), `summary`, `impact` (string[]), `stack` (string[])
- **Project** - `slug` (route segment), `name`, `title`, `summary`, `role`,
  `period`, `category` (Service slug, drives the filter), `stack`, `featured`,
  `isPlaceholder`, `links` ({ `live`?, `repo`? }), `metrics` ({ `label`,
  `value`, `evidence` }[]; no number without evidence), `cover` (ImageAsset),
  `caseStudy` (CaseStudySection[])
- **CaseStudySection** - `heading` (Overview, The Problem, The Solution, Key
  Features, Architecture, Engineering Challenges, Testing, Technology, My Role,
  Outcome, in that order), `body` (string[]), `bullets`?
- **Resume** - `title`, `summary`, `experience` and `development` ({ `roleId`,
  `title`, `organisation`, `location`, `highlights`, `technologies` }[]),
  `projects` ({ `slug`, `name`?, `subtitle`, `description`, `highlights` }[]).
  Dates and stacks come from the role and project; an unknown reference, or a
  technology not in `skills`, fails the build
- **ContactSubmission** (validated, never stored) - `name`, `email`, `company`?,
  `projectType` (business-website | web-application | saas-product | ecommerce
  | booking-system | admin-dashboard | figma-to-nextjs | other), `message`,
  `existingDesign`, `budgetRange`? (NZD brackets, never displayed), `timeline`,
  `website` (honeypot, must be empty). One Zod schema in
  `src/lib/validation/contact.ts` serves form and action.

> A production build is refused while any project has `isPlaceholder: true`
> (seeded fiction); feature 14 cleared them all.

### Dashboard: Neon Postgres through Prisma

Neon's Managed Better Auth owns `user`, `session`, `account` and `verification`
in the same database's `neon_auth` schema; the signed-in owner (`neon_auth.user`,
uuid ids) owns every record below. Money is integer minor
units beside an explicit currency (ZAR | NZD | AUD | USD | GBP), percentages are
integer basis points, and no card data is stored.

- **Client** - `name`, `email`, `phone`?, `companyName`?, `countryCode`?,
  `defaultCurrency`, billing address, `notes`?, `stripeCustomerId`?,
  `archivedAt`?. Has many projects
- **Project** - `clientId`, `name`, `description`?, `status` (draft | active |
  on_hold | completed | cancelled), `currency`, `totalAmountMinor`,
  `startDate`?, `expectedEndDate`?, `completedAt`?. Has many milestones
- **Milestone** (the payment plan) - `projectId`, `name`, `position`,
  `billingTrigger` (upfront, for the deposit | on_completion), `pricingMode`
  (percentage | fixed), `percentageBps`?, `amountMinor` (always concrete),
  `status` (work only: pending | in_progress | completed | cancelled),
  `dueDate`?, `completedAt`?. Has many tasks and payment requests
- **Task** - `milestoneId`, `title`, `description`?, `position`, `status`
  (pending | in_progress | completed | blocked | cancelled), `completedAt`?
- **PaymentRequest** - `projectId` and `milestoneId` (kept consistent by a
  composite key), `invoiceNumber`, `amountMinor`, `currency`, `status` (pending
  | requested | processing | paid | failed | cancelled | refunded),
  `publicToken` (the stable pay link), the current Checkout session, `dueDate`?.
  At most one open request per milestone
- **Payment** (money received, separate from requests) - `paymentRequestId`,
  `amountMinor`, `amountRefundedMinor`, `currency`, `status` (succeeded |
  partially_refunded | refunded), unique Stripe payment intent, session and
  charge ids, `paidAt`, `disputedAt`?
- **Activity** - append-only audit trail: `type`, `actor` (owner | client |
  stripe | system), snapshot `summary`, typed `data`, optional links to the
  client, project, milestone, task and request
- **EmailMessage** and **StripeEvent** - idempotency ledgers for email sends and
  webhook events

Derived on the server, never stored: allocated and unallocated plan value, paid,
outstanding, requested, payment and development progress, each milestone's
payment status, billable and overdue.

> Locked for every dashboard feature: money as integer minor units with a
> currency, never summed across currencies, and milestone work status kept
> separate from payment status. Full columns, constraints and indexes:
> `blueprint/dashboard-architecture.md` §4.

## Tech stack

- **Next.js 16 (App Router)** - public routes statically generated; server work
  is the contact action, the dashboard, sign-in and payment pages, and the Managed
  Better Auth proxy and Stripe webhook route handlers
- **React 19 with the React Compiler** - no hand-written memoization
- **TypeScript (strict)** - malformed content fails the build
- **Server components by default** - client islands: theme toggle, mobile
  menu, contact form, project filter, technology-row pause, resume print button,
  animation wrappers
- **Tailwind CSS v4** - CSS-first config, design decisions as CSS variables
- **shadcn/ui on Radix** - primitives retuned to the brand palette
- **Motion** - public-site animation via LazyMotion, reduced-motion aware; the
  technology row and hero showcase entrance are CSS keyframes, from first paint
- **react-hook-form + Zod** - forms, one schema for client and server
- **Resend** - contact email, the dashboard's payment and reminder emails as React
  Email templates, and the SMTP relay for Neon's auth emails
- **Neon Postgres + Prisma ORM and Prisma Migrate** - dashboard data and migrations
- **Neon Managed Better Auth** (`@neondatabase/auth`) - owner email and password
  sign-in, sign-up closed
- **Stripe Checkout and webhooks** - milestone payments, hosted card collection
- **dnd-kit** - accessible reordering
- **Vitest** - logic tests, gating since feature 5
- **Playwright MCP** - browser verification during the build
- **Git and GitHub** - a Verify command is still to be wired via `/ci`

Current installed stack: Next.js 16.3.4, React 19.2.8, Zod 3.25, Vitest,
Resend, and Prisma 7.10 with `pg` and `@vercel/functions`. Auth/Stripe packages
remain planned. Dashboard uses a `pg` Pool attached by `@vercel/functions` under
`@prisma/adapter-pg`, snake_case through `@map`, and the Managed Better Auth server SDK.
Only active-leaf dependencies are installed. Strict TypeScript, no `any`, no
Tailwind config, proxy/middleware or public DB/session reads.

## Monetization

Success is qualified enquiries, not visits; the public site sells no product.
Project type, design status, timeline and optional NZD budget brackets (under
5,000 through 60,000+, or not sure) qualify enquiries. Those brackets are shown
only in the form: no rates/prices or public milestone percentages. Dashboard
collects agreed fees through the developer's Stripe account without commissions;
amounts appear only in the dashboard/client's own pay page.

## UI/UX

Reference: `design/website-ui-design.png`. Dashboard references: approved
`prototypes/overview.html`, `project.html`, `create.html`, `pay.html`, `theme.css`.
Preserve mockups until consumed; port needed tokens before dashboard UI.
Dark default/light supported; layered near-black/violet surfaces, cards,
eyebrows/headings, delivered-work hero showcase, display/body/monospace trio.
False client statistics, skill percentages and the empty blog link are removed.

Home: hero/availability/stack/showcase → four value points → four services →
audiences → selected work → seven reasons → seven process steps → grouped
technologies → about → location → final CTA. Services are business websites,
custom web applications, SaaS, Figma to production; their CTAs preselect enquiry
type. Nav: Home, Services, Work, Process, About, Contact; Start a Project on
every page/mobile menu. Background pages remain reachable from About.

WCAG AA contrast, keyboard operation, correct landmarks/headings and associated
announced field errors apply throughout. Public Motion animates transform/opacity,
respects reduced motion and leaves the largest heading unanimated. Dashboard:
sidebar collapses on mobile, same themes/tokens, no entrance motion, textual
status plus colour and tabular money figures.

Public static/SSG routes: `/`, `/about`, `/services`, `/process`, `/skills`,
`/experience`, `/projects`, `/projects/[slug]`, `/resume`, `/contact`, sitemap,
robots, social images and 404. SiteChrome owns marketing main/header/footer;
resume is standalone/A4-printable and root 404 uses SiteChrome. Case studies:
overview, problem, solution, features, architecture, challenges, testing,
technology, role, outcome, then CTA. Contact asks name/email/company, eight
project types, description, design availability, optional budget and timeline;
reply commitment is one business day.

Planned dynamic/noindex: `(auth)` login/forgot/reset/verification (no register; sign-up closed);
`/dashboard` client/project/milestone/payment/settings routes, `/pay/[token]`,
`/payment/success`. Exact paths in architecture §19. Every protected page,
query/action authenticates the owner; layout protection alone is insufficient.

## Deployment

- Existing Vercel Next.js project, Functions `syd1`. `npm run build`,
  `npm run start`, `npm run dev`; no static export/output directory or health endpoint.
- Public routes stay static; server work is contact and planned auth/dashboard/
  pay routes, Managed Better Auth proxy handler and Stripe webhook.
- One Neon Postgres in `aws-ap-southeast-2`: protected production, development
  for local/preview, isolated test branch. Runtime `DATABASE_URL` pooled;
  migration `DATABASE_URL_UNPOOLED` direct. SQL reviewed/approved separately,
  never run in build or through shared-branch `prisma db push`/`migrate dev`.
  Managed Better Auth is enabled per branch. No MVP buckets/workers/cron.
- Existing env: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`,
  `NEXT_PUBLIC_SITE_URL`. Planned env: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`,
  `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `OWNER_EMAIL`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `BILLING_FROM_EMAIL`, test-only `TEST_DATABASE_URL`.
  Secrets stay server-only, lazy and redacted.
- NZ Stripe account, Checkout/refund/dispute webhook; test keys until go-live.
  Resend needs verified production sender; shared test sender for development.
  Auth verification/reset must reach a usable owner inbox.
- `mohamedhnoor.com`; `NEXT_PUBLIC_SITE_URL` sets build-time canonicals,
  sitemap/social images and pay redirects and must match deployment.
- `npm run preflight` rejects seeded placeholders; none remains. Other gates
  are AGENTS.md build/test/lint/typecheck. No Verify/automatic CI/Browser tests
  command currently exists. Push, shared DB migration and deployment need explicit approval.

## Open questions

- **Resend readiness:** previously marked unverified; confirm delivery before
  live verification/reset in 16b, where Neon's auth emails go through Resend SMTP.
  Offline 16a does not depend on mail.
- **Neon readiness:** development/test connectivity has not been verified;
  16a prepares Prisma tooling. Managed Better Auth is not yet enabled on any
  branch. Applying migrations requires a named target and approval.
- **CI gap:** project-plan promises Verify/automatic checks and build-plan says
  CI precedes feature 13; neither exists. `/ci` is separate; fallback gates remain usable.
- **Security headers:** shipped CSP/HSTS/other headers and feature 15's CSP
  expansion are absent from project-plan deployment text; preserve runtime behavior.
- **Feature 23 gap:** 2FA, monitoring, backups and E2E are listed in build-plan
  beyond project-plan's detail; confirm scope at that feature. Managed Better Auth
  has no two-factor support yet (roadmap), so 2FA either waits for Neon or needs
  self-managed Better Auth.
- **Hero evidence:** showcase includes React Native and North City Islamic Youth
  Centre without corresponding case studies; confirm claims or revise the image.

Resolved intent: production domain, full-stack positioning, real replacement
projects, `/contact` route, CV link empty until supplied. Geographic client claims
require evidence. Feature 16's split changes sequencing only: owner-only app,
clients pay without accounts.
