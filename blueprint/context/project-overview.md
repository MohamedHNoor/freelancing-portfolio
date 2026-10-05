# Freelance Portfolio - Project Overview

<!-- blueprint:source-hash 699cfe682cbdef4bfef9bc0a66b4317b72c52363b84427c527fc96c83b941d88 -->

> The portfolio of a full-stack web developer in Wellington that turns search,
> LinkedIn and GitHub traffic into project enquiries, plus a private business
> dashboard that runs won work and collects milestone payments through Stripe.

## Problem

A freelance developer with delivered work but no public reviews has to win work
on evidence alone. Five projects have shipped to direct clients since August
2023, none through a rated platform, so a client opening a proposal link has
seconds to learn who this is, whether they can build this specific thing, and
whether hiring is safe. Most portfolios fail that test with a generic tagline,
self-assigned skill percentages and unexplained screenshots. This site is a
conversion page, not a gallery: it says in the first screen what is built and
for whom, presents every project as a case study, and substitutes demonstrable
proof for the social proof it lacks. The conversion path is search,
LinkedIn or GitHub, then the portfolio, a case study, Start a Project and an
enquiry. It is also a work sample, so its own performance and accessibility
scores are build gates, not goals.

Once work is won it has to be run and paid for. Engagements are priced as a
total with a deposit (typically 30 or 50 percent) and milestone payments, each
milestone moving through work done, payment requested and payment received. A
private dashboard on the same domain keeps clients, projects, payment plans and
tasks together, collects each milestone payment through Stripe Checkout, and
keeps development progress separate from payment progress.

## Users

Public visitors arrive cold, often on mobile, from a link pasted into a message
thread, so every section has to earn the next scroll, and all of them want to
deal directly with the developer. The market is New Zealand, Australia and
international; Wellington is stated plainly, but no client in any country is
implied. Rows follow the site's order.

| User | Judging on |
|---|---|
| Businesses needing a website or custom software that fits how they operate | Credibility, reliability, clear communication |
| Startups turning an idea into an MVP and then a production product | Authentication, tenant isolation, payments and tests built in; the travel platform case study is the evidence |
| Agencies with client projects and Figma designs to build | Production quality and white-label terms; rests on this site's build standard, as no agency engagement exists yet |
| Entrepreneurs with an idea and no one technical | Someone to handle frontend to backend |
| Recruiters and engineering managers (from LinkedIn or GitHub) | A resume and a fast code-quality signal |

Dashboard users, who never see the sales pitch:

- **The developer** - the only account (owner). Manages clients, projects, plans
  and tasks and requests payments, mostly on desktop
- **Paying clients** - no account. Receive an itemized request email, review it
  on a private pay page, and pay through Stripe's hosted Checkout

## Features

In build-plan order; the spec is `/feature`'s job.

1. **Design system and app shell** - tokens, font trio, header, footer, theme.
2. **Content layer** - the typed content contract every section reads.
3. **Hero and about** - positioning, availability, the about narrative.
4. **Services** - the four services, what each suits, how a project runs.
5. **Skills and experience** - stack by purpose with usage context; timeline.
6. **Selected projects and index** - outcome-framed cards, filterable index.
7. **Case study pages** - ten-part case studies. **Headline feature.**
8. **Resume** - printable resume route plus a downloadable CV.
9. **Section detail pages** - each home section links to its full page.
10. **Contact** - qualifying form, shared validation, Server Action, Resend.
11. **SEO and social sharing** - metadata, sitemap, robots, social images,
    structured data.
12. **Accessibility and performance pass** - axe clean, reduced motion, budgets.
13. **Deployment readiness** - Vercel config, env vars, smoke tests.
14. **Real projects replace the placeholders** (post-MVP) - two real case
    studies, so the production deploy gate passes.

Business dashboard, not yet built (design reference:
`blueprint/dashboard-architecture.md`):

15. **Site and dashboard separation** - public pages move into their own route
    group with URLs, static generation, budgets and behaviour unchanged; robots
    and the CSP learn the private paths and Stripe Checkout. The route group
    shipped early with the resume rework, `/resume` deliberately outside it;
    robots, the CSP and where `MotionProvider` and `SkipLink` live remain.
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
- **Server components by default** - client islands: theme toggle, mobile
  menu, contact form, project filter, technology-row pause, resume print button,
  animation wrappers
- **Tailwind CSS v4** - CSS-first config, design decisions as CSS variables
- **shadcn/ui on Radix** - primitives retuned to the brand palette
- **Motion** - public-site animation via LazyMotion, reduced-motion aware; the
  technology row and hero showcase entrance are CSS keyframes, from first paint
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

Indirect. The site sells nothing: it converts traffic from search, LinkedIn,
GitHub and proposals into qualified enquiries for websites and web applications,
measured in enquiries, not visits. No rates or prices appear on the public site.
The contact form captures project type, design status, timeline and an optional
NZD budget bracket, the only figures on the site. Larger projects are split into
milestones agreed before development, and the site describes that model without
percentages.

The dashboard collects payment for engagements already agreed, through the
developer's own Stripe account, with no fees or commissions. Amounts appear only
in the dashboard and on a client's own pay page.

## UI/UX

Reference: `design/website-ui-design.png`. Dark, layered near-black surfaces,
violet accent, a showcase of delivered projects in the hero, eyebrow-and-heading rhythm,
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

Public, all statically generated. Every page except `/resume` lives in the
`(site)` route group, whose layout adds the header and footer; `/resume` and the
404 render their own.

- `/` - hero with the project showcase and four value points, then summaries
  linking to their pages (order in `project-plan.md` §3), ending in a call to
  action
- `/about`, `/services`, `/process`, `/skills`, `/experience` - the full content
- `/projects` - index filterable by service and technology; `/projects/[slug]` -
  one static case study each
- `/resume` - a standalone, recruiter-facing resume that prints to A4
- `/contact` - the qualifying enquiry form
- `/sitemap.xml`, `/robots.txt`, generated social images, 404 page

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
- **`Verify` command never created.** §5 promises one wired to automatic
  checks, and the build plan's intro still dates `/ci` before feature 13. Run
  `/ci` before feature 16 adds integration tests, or drop the claim.
- **Security headers are not in the plans.** Feature 13 shipped a CSP, HSTS
  and four more headers that §8 never names, and feature 15 changes the CSP.
  Add them to §8.
- **Feature 23 goes beyond `project-plan.md`.** Two-factor sign-in, error
  monitoring, an end-to-end payment test and backups appear in no plan section.
  Add them or trim the item, which is also the build plan's one bundle.
- **The hero showcase claims more than §3.** Its labels show a React Native
  mobile app and a website for the North City Islamic Youth Centre, neither of
  which has a case study, and mobile apps are not one of the four services.
  Confirm both projects and the service, or replace the image.

Resolved, recorded so they are not reopened: the custom domain (§8 now names
`mohamedhnoor.com`); the positioning (full-stack web development for
businesses, startups, agencies and entrepreneurs, which replaced the earlier
agency and startup SaaS niche focus); seeded content (all replaced, and the CV
link stays empty by design); and where contact lives (`/contact`, with a home
section linking to it).
