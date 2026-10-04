# Freelance Portfolio - Project Overview

<!-- blueprint:source-hash da747ee86642a28cd65c03fa4d0f14e343921258909a52032c037dd0dbfe701e -->

> A portfolio site that converts cold traffic into qualified freelance enquiries,
> led by agency white-label builds and startup SaaS, plus a private business
> dashboard that runs won work and collects milestone payments through Stripe.

## Problem

A freelance developer with delivered work but no public reviews has to win work
on evidence alone. Five projects have shipped to direct clients since August
2023, none through a rated platform, so a client opening a proposal link has
seconds to learn who this is, whether they can build this specific thing, and
whether hiring is safe. Most portfolios fail that test with a generic tagline,
self-assigned skill percentages and unexplained screenshots. This site
substitutes demonstrable proof for the social proof it lacks and presents every
project as a case study. It is also a work sample, so its own performance and
accessibility scores are build gates, not goals.

Once work is won it has to be run and paid for. Engagements are priced as a
total with a deposit (typically 30 or 50 percent) and milestone payments, each
milestone moving through work done, payment requested and payment received. A
private dashboard on the same domain keeps clients, projects, payment plans and
tasks together, collects each milestone payment through Stripe Checkout, and
keeps development progress separate from payment progress.

## Users

Public visitors arrive cold, often on mobile, from a link pasted into a message
thread, so every section has to earn the next scroll. The public site has no
sign-in. Rows are in the order the site presents them.

| User | Priority | Judging on |
|---|---|---|
| Design or digital agency hiring white-label development | Primary | Match to the design, speed and accessibility before their client sees it, the agency's name on the work with the client left to them, delivery time |
| Founder or early product team building a startup SaaS | Primary, higher value | A launch that holds up: authentication, tenant isolation, payments and tests built in, a codebase the first engineering hire can take over |
| Client hiring a Figma to Next.js build directly | Secondary | Design fidelity, responsiveness, speed, communication, delivery time |
| Recruiter or engineering manager | Tertiary | Resume and a fast code-quality signal |

There is no agency engagement to show yet, so the agency track rests on the build
standard this site proves; the travel platform case study is the startup SaaS
evidence.

Dashboard users, who never see the sales pitch:

- **The developer** - the only account (owner). Manages clients, projects, plans
  and tasks and requests payments, mostly on desktop
- **Paying clients** - no account. Receive an itemized request email, review it
  on a private pay page, and pay through Stripe's hosted Checkout

## Features

In build-plan order; the spec is `/feature`'s job.

1. **Design system and app shell** - brand tokens, font trio, header, mobile
   menu, footer, theme toggle, animation provider.
2. **Content layer** - the typed content contract every section reads.
3. **Hero and about** - positioning that names the service tracks,
   availability, credibility strip, about narrative. The first-impression gate.
4. **Services** - engagement tracks with scope, deliverables, timeline, and how
   a project runs.
5. **Skills and experience** - stack grouped by role with usage context, and the
   dated timeline.
6. **Selected projects and index** - outcome-framed home cards plus a filterable
   index route.
7. **Case study pages** - problem, approach, architecture, stack, outcome.
   **Headline feature**: the differentiator against a template portfolio.
8. **Resume** - print-optimized route plus a downloadable CV.
9. **Section detail pages** - `/about`, `/services`, `/skills`, `/experience`
   carry the full content; home sections become linked summaries; navigation
   targets routes.
10. **Contact** - qualifying form, shared validation, Server Action, Resend
    delivery, mailto fallback.
11. **SEO and social sharing** - metadata, canonicals, sitemap, robots, social
    images, structured data.
12. **Accessibility and performance pass** - keyboard, screen reader, axe,
    reduced motion, Lighthouse 95+, bundle and image budgets.
13. **Deployment readiness** - Vercel config, env vars, build verification,
    smoke tests.
14. **Real projects replace the placeholders** (post-MVP) - TravelGrid Africa
    and this site as case studies with real evidence; removing the seeded
    placeholders lets production builds pass the deploy gate.

Business dashboard, not yet built (design reference:
`blueprint/dashboard-architecture.md`):

15. **Site and dashboard separation** - public pages move into their own route
    group with URLs, static generation, budgets and behaviour unchanged; robots
    and the CSP learn the private paths and Stripe Checkout.
16. **Owner sign-in** - Neon and Drizzle foundation, Better Auth with
    verification and reset emails, owner-only registration, protected dashboard
    shell. Everything after it depends on it.
17. **Clients** - create, edit, archive and list, on integer money handling and
    the activity log.
18. **Projects and payment plans** - percentage, fixed or mixed milestone plans
    with an upfront deposit, exact balance before activation, and the project
    page with separate development and payment progress. **Headline dashboard
    feature.**
19. **Tasks and milestone completion** - tasks with status, reordering and
    computed progress; ready-for-completion state; manual completion and
    reopening; activity timeline.
20. **Payment requests and Checkout** - stable private pay link, Review & Pay
    page opening Stripe Checkout, request and reminder emails, cancel and retry.
21. **Payment confirmation** - a verified, idempotent Stripe webhook as the only
    path that records money received; refunds, disputes, owner notifications,
    success page, server-side Sync with Stripe.
22. **Business overview and payments** - value, paid, outstanding and requested
    totals per currency; pending requests, deadlines, recent activity; payments
    list.
23. **Dashboard hardening and launch** - two-factor sign-in, sessions, error
    monitoring, end-to-end payment test, reconciliation, backups, production
    setup.

Still candidates: a writing section, and testimonials once genuine ones exist.
Out of scope for the site: blog, CMS, analytics dashboards, testimonials, any
pricing display. Out of scope for dashboard v1: client accounts or a portal,
generated PDF invoices, partial payments, automatic reminders, file storage,
currency conversion, and Stripe Connect (one freelancer's business, not a
marketplace).

## Data model

### Public site: content modules, no database

All public content is typed TypeScript under `src/content/`, imported at build
time so every public route is statically generated; types live in
`src/types/content.ts`. Public pages never query the database.

> `Project` and `CaseStudySection` are locked shapes read by the home section,
> the index, the case study route, social images and structured data. Treat
> changes as breaking.

- **Profile** (single record) - `name`, `headline`, `specialisms` (Service
  slug[]), `shortBio`, `longBio` (string[]), `availability` ({ `status`:
  available | limited | unavailable, `detail` }), `location`, `links` ({ `email`,
  `github`, `linkedin`, `cv` }), `proofPoints` (ProofPoint[])
- **ProofPoint** - `value`, `label`, `evidence` (required: no number ships
  without something to point at)
- **Service** - `slug` (agency-builds | startup-saas | figma-to-nextjs), `name`,
  `forWho`, `summary`, `deliverables` (string[]), `typicalTimeline` (no prices),
  `process` ({ `title`, `detail` }[]), `order`
- **SkillGroup** - `id`, `label`, `skills` ({ `name`, `context`, `icon`? }[]);
  no proficiency percentages
- **Role** - `id`, `company`, `title`, `start` (`YYYY-MM`), `end` (`YYYY-MM` |
  present), `summary`, `impact` (string[]), `stack` (string[])
- **Project** - `slug` (route segment), `title`, `summary`, `role`, `period`,
  `category` (Service slug, drives the filter), `stack`, `featured`,
  `isPlaceholder`, `links` ({ `live`?, `repo`? }), `metrics` ({ `label`,
  `value`, `evidence` }[]), `cover` ({ `src`, `alt`, `width`, `height` }),
  `caseStudy` (CaseStudySection[])
- **CaseStudySection** - `heading` (Problem, Approach, Architecture, Outcome, in
  that order), `body` (string[]), `bullets`?
- **ContactSubmission** (validated, never stored) - `name`, `email`, `message`,
  `projectType` (agency-build | saas-build | figma-conversion | other),
  `timeline`, `budgetRange`? (never displayed), `company` (honeypot, must be
  empty). One Zod schema in `src/lib/validation/contact.ts` serves form and
  action.

> `isPlaceholder: true` marks fictional seeded content, and a production build
> is refused while any project carries it. Feature 14 cleared it everywhere.

### Dashboard: Neon Postgres through Drizzle

Better Auth owns `user`, `session`, `account` and `verification` in the same
database; the signed-in user owns every record below. Money is integer minor
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
  is the contact action, the dashboard, sign-in and payment pages, and the Better
  Auth and Stripe webhook route handlers
- **React 19 with the React Compiler** - no hand-written memoization
- **TypeScript (strict)** - malformed content fails the build
- **Tailwind CSS v4** - CSS-first config, design decisions as CSS variables
- **shadcn/ui on Radix** - primitives retuned to the brand palette
- **Motion** - public-site animation via LazyMotion, reduced-motion aware
- **react-hook-form + Zod** - forms, one schema for client and server
- **Resend** - contact email, plus the dashboard's payment, reminder and auth
  emails as React Email templates
- **Neon Postgres + Drizzle ORM and Drizzle Kit** - dashboard data and migrations
- **Better Auth** - owner email and password sign-in, Drizzle adapter
- **Stripe Checkout and webhooks** - milestone payments, hosted card collection
- **dnd-kit** - accessible reordering
- **Vitest** - logic tests, gating since feature 5
- **Playwright MCP** - browser verification during the build
- **Git and GitHub** - a Verify command is still to be wired via `/ci`

## Monetization

Indirect. The site sells nothing: it turns cold traffic from proposals, LinkedIn
and GitHub into qualified enquiries in the target niches, measured by matching
enquiries, not visits. No rates or prices appear on the public site; the contact
form captures project type, timeline and an optional budget range instead.

The dashboard collects payment for engagements already agreed, through the
developer's own Stripe account, with no fees or commissions. Amounts appear only
in the dashboard and on a client's own pay page.

## UI/UX

Reference: `design/website-ui-design.png`. Dark, layered near-black surfaces,
violet accent, a code-editor motif in the hero, eyebrow-and-heading rhythm,
card-based blocks. Confident and technical. Dark is the default; light is
supported and both must keep working.

Deliberately changed from the reference: invented client-count statistics, skill
percentage bars and the blog link are removed; services, an experience timeline
and case studies are added; navigation targets routes rather than anchors, so a
proposal can link straight to the right depth. A display, body and monospace
type trio replaces the scaffold default. Motion animates transform and opacity
only, collapses under `prefers-reduced-motion`, and never touches the largest
contentful heading.

Accessibility is a service the site sells: WCAG AA contrast, full keyboard
operation, correct landmarks and heading order, form errors wired to their
inputs. The dashboard meets the same bar with the same tokens and themes: a
desktop-first sidebar app that collapses on mobile, no entrance motion, status
always in text as well as colour, and tabular figures for money.

### Routes

Public, all statically generated:

- `/` - hero, credibility strip, then linked summaries of about, services,
  selected projects, skills and experience (projects above skills: delivery
  outranks a technology list)
- `/about`, `/services`, `/skills`, `/experience` - the full section content
- `/projects` - index filterable by category and stack; `/projects/[slug]` - one
  static case study each
- `/resume` - print-optimized CV
- `/sitemap.xml`, `/robots.txt`, generated `opengraph-image`, 404 page

Private and payment screens, dynamic and not indexed: sign-in, registration and
password reset; dashboard overview, clients, projects, project page, milestone
page, payments, settings; the client's pay page and the post-payment success
page. Paths are in `blueprint/dashboard-architecture.md` §19.

## Deployment

- **Host:** Vercel, standard Next.js App Router application; Functions in `syd1`
- **Build:** `npm run build`, served by Vercel's Next.js runtime
- **Server work:** the contact action, the dashboard, sign-in and payment pages,
  and the Better Auth and Stripe webhook handlers; every public route is static
- **Env vars:** `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`,
  `NEXT_PUBLIC_SITE_URL`; for the dashboard `DATABASE_URL`,
  `DATABASE_URL_UNPOOLED`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
  `OWNER_EMAIL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `BILLING_FROM_EMAIL`
- **Database:** one Neon Postgres in `aws-ap-southeast-2`. Migrations are an
  explicit, approved step before a deploy, never part of the build. No storage
  buckets, workers or cron jobs
- **Stripe:** a New Zealand account with one webhook endpoint for Checkout,
  refund and dispute events; test keys until go-live
- **Resend:** a verified sender domain before contact and payment emails deliver
  in production; development can use the shared test sender
- **Domain:** `mohamedhnoor.com`, matched by `NEXT_PUBLIC_SITE_URL` for
  canonicals, sitemap, social images, pay links and Stripe redirects. These are
  build-time values, so changing the origin needs a rebuild
- **Health check:** not applicable
- **Deploy gate:** a production build is refused while any project is a seeded
  placeholder; none is, so it passes
- Nothing is pushed or deployed without a direct yes

## Open questions

> Resolve in the plans, then re-run `/overview`.

- **Resend sender domain not verified.** Contact email does not deliver in
  production until it is (the form fails closed and shows the direct address).
  It now gates the dashboard too: owner sign-up requires a verification email,
  and every payment request is an email.
- **`Verify` command never created.** §5 names one wired to automatic checks,
  and the build plan's intro still says `/ci` runs before feature 13, which
  shipped without it. Run `/ci`, ideally before feature 16 adds integration
  tests, or drop the claim.
- **Security headers are not in the plans.** Feature 13 shipped a CSP, HSTS,
  `nosniff`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy`; §8
  names none, and feature 15 now changes the CSP. Add them to §8.
- **Feature 23 goes beyond `project-plan.md`.** It names two-factor sign-in,
  error monitoring, an end-to-end payment test and backups, while §3 lists only
  verification and reset for sign-in and §5 and §8 name no monitoring, browser
  test runner or backups. Add them to the plan or trim the item. It is also the
  build plan's one bundle; `/feature 23` may need to split it.

Resolved, recorded so they are not reopened: the custom domain (§8 now names
`mohamedhnoor.com`); the target niches (agency and startup SaaS first, Figma to
Next.js kept); seeded content (all replaced, and the CV link stays empty by
design); and where contact lives (`/contact`, with a home section linking to it).
