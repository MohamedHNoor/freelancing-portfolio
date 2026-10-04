# Project Plan

## 1. Problem - What problem are we solving?

A freelance developer with delivered work but no public reviews has to win work on
evidence alone. Five projects have shipped to direct clients since August 2023, none of
them through a platform that carries a rating, so a prospective client arrives with
nothing to read about the person they are considering. When that client opens a proposal
link, the portfolio has a few seconds to answer three questions: who is this, can they
build my specific thing, and is it safe to hire them.

Most developer portfolios fail this. They lead with a generic tagline ("I build things for
the web"), list technologies with self-assigned percentage bars, and show project
screenshots with no explanation of what problem was solved or what changed as a result. A
client cannot tell a capable developer from a template.

This site solves that by being a conversion page rather than a gallery. It states a
specific specialism in the first screen, presents each project as a case study with
problem, approach, technologies, and outcome, and substitutes demonstrable proof
(Lighthouse scores, Core Web Vitals, pixel fidelity, accessibility conformance) for the
social proof a new account does not have yet.

The site is also itself a work sample. Its own performance and accessibility scores are
part of the argument, which is why they are treated as build gates rather than goals.

Once work is won, it has to be run and paid for. Engagements are priced as a total with a
deposit, typically 30 or 50 percent, followed by milestone payments, and each milestone
moves through work done, payment requested, and payment received. A private business
dashboard on the same domain, invisible to visitors, keeps clients, projects, milestone
payment plans, and tasks in one place and collects each milestone payment through Stripe
Checkout. It keeps development progress and payment progress separate, so it is always
clear how much of the work is done against how much of the price has been paid.

## 2. Users - Who is this for?

The site focuses on two buyer types and keeps a third track open. In the order the site
presents them:

**Primary: design and digital agencies hiring white-label development.** An agency with
signed client work, a finished design, and more projects than developers to build them.
They are evaluating on: will the build match the design, will it be fast and accessible
before their client sees it, will it ship under the agency's name with the client
relationship left with the agency, and will it be delivered on time. There is no agency
engagement to show yet, so this track rests on the build standard this site itself proves.

**Primary: founders building a startup SaaS.** Founders and early product teams taking a
SaaS from idea or prototype to its first paying customers on React, Next.js, Node, and
Postgres. They are evaluating on: can this person reach a launch that holds up, with
authentication, tenant isolation, payments, and tests in place rather than bolted on
later, and will the codebase suit the first engineering hire. Higher budgets and a harder
sell without reviews; the travel platform case study is the evidence.

**Secondary: clients hiring a Figma to Next.js build directly.** A founder, designer, or
marketing team with a finished design file and no front-end capacity, evaluating on design
fidelity, responsiveness, speed, communication, and delivery time.

**Tertiary: recruiters and engineering managers** who arrive from LinkedIn or GitHub and
want a resume and a code-quality signal quickly.

All of them arrive cold, often on mobile, often from a link pasted into a message thread.
No one is browsing. Every section has to earn the next scroll.

The business dashboard has two further users, neither of whom sees the public site's
sales pitch:

**Private: the developer, as the dashboard's only account.** Manages clients, projects,
payment plans, and tasks, and requests milestone payments, mostly from a desktop.

**Paying clients, without accounts.** A client receives an itemized payment request by
email, reviews it on a private pay page, and pays through Stripe's hosted Checkout. They
never sign in.

## 3. Features - What does the MVP need?

- Hero that states the specialisms in a two-line headline, agency and startup work
  first, with a primary call to action and a current availability status
- Credibility strip of demonstrable metrics, replacing invented client-count statistics
- About section: a short narrative of how the developer works and what they are good at
- Services: three named engagement tracks, white-label builds for agencies, SaaS for
  startups, and Figma to production Next.js, each with scope, deliverables, process, and
  typical timeline
- Selected projects on the home page, framed by outcome rather than screenshot
- Project index at its own route, filterable by technology or project type
- Case study pages covering problem, approach, architecture, stack, and outcome
- Technical skills grouped by role in the stack, with the context each was used in
- Professional experience as a dated timeline
- A detail route for each of about, services, skills and experience, carrying the full
  content while the matching home section carries a scannable summary and a link to it.
  This is the shape projects already has: a featured subset on the home page, everything
  at `/projects`. Primary navigation points at these routes rather than at home page
  anchors, so every item in the header is a page a proposal can link to directly
- Print-optimized resume page plus a downloadable CV
- Contact section with a qualifying enquiry form that emails the developer, plus GitHub,
  LinkedIn, and a direct mailto fallback
- Light and dark themes, with dark as the default
- Full metadata, sitemap, robots, generated social images, and structured data

Explicitly out of scope for the MVP: a blog, a CMS, analytics dashboards, testimonials
(there are none yet to publish), and any pricing display.

### Post-MVP: private business dashboard

- Owner-only sign-in with email verification and password reset. Registration accepts only
  the owner's address and closes after the first account
- Clients with contact details, company, country, default currency, and billing address
- Projects with a total, a currency, dates, and a status: draft, active, on hold,
  completed, or cancelled
- Payment plans as milestones priced by percentage or by fixed amount, with the deposit as
  an upfront milestone. A plan must add up exactly to the project total before the
  project can be activated
- Tasks inside each milestone, with milestone progress computed from them. A milestone is
  completed manually, never automatically when its last task is ticked
- Payment requests for billable milestones: a stable private pay link, an itemized request
  email with an invoice number, and Stripe Checkout. Stripe issues the paid invoice and
  receipt
- Payments confirmed only by a verified Stripe webhook, never by the success redirect,
  with refunds and disputes tracked
- Manual payment reminders and owner notifications by email
- A dashboard of projects and money per currency, a project page with separate
  development and payment progress, and an activity timeline for each project

Out of scope for the dashboard's first version: client accounts or a portal, generated PDF
invoices, partial payments, automatic reminders, file storage, currency conversion, and
Stripe Connect, because this is one freelancer's business rather than a marketplace. The
full design is in `blueprint/dashboard-architecture.md`.

## 4. Data - What are we storing?

The public site has no database. All of its content is typed TypeScript modules under
`src/content/`, imported at build time so every public page can be statically generated.

- `profile` - name, headline, specialisms, short and long bio, availability status,
  location, social and contact links
- `services` - slug, name, who it is for, deliverables, typical timeline, process steps
- `skills` - groups (front end, back end, data, tooling, practices) with per-technology
  usage context
- `experience` - roles with company, title, period, summary, and impact points
- `projects` - slug, title, summary, role, period, stack, featured flag, links, outcome
  metrics, a placeholder flag, and case study sections
- Contact submissions are not stored. They are validated and forwarded by email.

The placeholder flag exists so seeded example projects can never be mistaken for real
client work. No project may ship to production with it set.

The private business dashboard stores its data in one Neon Postgres database through
Drizzle, alongside Better Auth's own user, session, account, and verification tables:

- `clients`, `projects`, `milestones` (the payment plan), and `tasks`
- `payment_requests` and `payments`, kept separate so money asked for and money received
  never blur
- `activities`, an append-only audit trail for each project
- `email_messages` and `stripe_events`, which make email sends and webhook processing
  idempotent

Money is stored as integer minor units with an explicit currency, and percentages as
integer basis points, so no calculation touches a floating-point number. Totals, paid, and
outstanding figures are derived by queries rather than stored. Card details are never
stored; Stripe holds them.

## 5. Tech - What stack are we using?

- Next.js 16 (App Router) with React 19 and the React Compiler
- TypeScript in strict mode
- Tailwind CSS v4, CSS-first configuration
- shadcn/ui on Radix primitives, retuned to the brand palette rather than stock tokens
- Motion for animation, code split via LazyMotion, reduced-motion aware
- react-hook-form and Zod for the contact form, with one schema shared by client and server
- Resend for transactional email, called from a Server Action
- Vitest for logic tests, added before the contact feature
- Playwright MCP for browser verification during the build
- Git and GitHub, with a Verify command wired to automatic checks
- For the private dashboard: Neon Postgres with Drizzle ORM and Drizzle Kit migrations,
  Better Auth (email and password, Drizzle adapter), Stripe Checkout and webhooks, React
  Email templates sent through Resend, and dnd-kit for accessible reordering

Server components by default. Client components only for the theme toggle, mobile
navigation, contact form, project filter, and animation wrappers on the public site, and
for forms, the task list, and dialogs in the dashboard.

## 6. Monetize - How will this make money?

Indirectly. The site does not sell anything. It converts cold traffic from proposals,
LinkedIn, and GitHub into qualified enquiries for freelance engagements in the target
niches: agency white-label builds and startup SaaS first, Figma to Next.js builds as well.
Success is measured in enquiries that match those niches, not in visits.

The contact form captures project type, timeline, and an optional budget range so enquiries
arrive pre-qualified. No rates or prices appear anywhere on the site; pricing is a
conversation, and publishing it either anchors the developer low or filters out clients who
would have paid more.

The business dashboard does not change this. It collects payment for engagements already
agreed, through the developer's own Stripe account, with no fees or commissions added.
Amounts appear only inside the dashboard and on a client's own pay page, never on the
public site.

## 7. UI/UX - How should this look and feel?

Reference: `design/website-ui-design.png`. Dark, layered near-black surfaces with a violet
accent, a code-editor motif in the hero, section eyebrow labels, and card-based content
blocks. Confident and technical, not playful.

Kept from the reference: the palette, the hero composition, the eyebrow-and-heading section
rhythm, and the card language.

Deliberately changed:

- The client-count and satisfaction statistics are removed. They would be false for an
  account with no completed jobs, and a client who cross-checks sees the mismatch
  immediately. Demonstrable metrics take their place.
- Skill percentage bars are removed. Self-assigned proficiency scores are filler; grouped
  stacks with real usage context say more.
- The blog navigation item is removed. An empty blog is a negative signal.
- A services section, an experience timeline, and case study pages are added. The reference
  has none of them, and all three are load-bearing for these buyers.
- Navigation targets routes rather than same-page anchors. The home page stays a single
  scroll that has to earn attention section by section, but each section also has a page
  behind it, so a proposal can link straight to the relevant depth instead of to a hash
  the reader has to scroll away from. It also keeps the home page from growing without
  limit as real content replaces the seeded placeholders.

Typography moves off the scaffold default to a display, body, and monospace trio so the
site does not read as an untouched template. Motion is used for staged entrances and scroll
reveals, always on transform and opacity, always collapsing under
`prefers-reduced-motion`, and never on the largest-contentful hero heading.

Accessibility is a service the site sells, so the site has to pass its own claim: WCAG AA
contrast, full keyboard operation, correct landmarks and heading order, and form errors
wired to their inputs.

The business dashboard reuses the same tokens, type, and both themes, laid out as a
desktop-first sidebar app that collapses on mobile. It is a working tool, so it has no
entrance motion. Status is always stated in text as well as colour, and money uses
tabular figures. The accessibility bar is the same as the public site's.

## 8. Deployment - Where and how will this ship?

- Host: Vercel, as a standard Next.js App Router application
- Build command: `npm run build`, output served by Vercel's Next.js runtime
- All public routes statically generated. The server work is the contact Server Action
  plus the private dashboard, the sign-in and payment pages, and two route handlers:
  Better Auth and the Stripe webhook
- Environment variables by name: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
  `CONTACT_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`, and for the dashboard `DATABASE_URL`,
  `DATABASE_URL_UNPOOLED`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `OWNER_EMAIL`,
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BILLING_FROM_EMAIL`
- One Neon Postgres database in Sydney (`aws-ap-southeast-2`), with Vercel Functions in
  `syd1` beside it. No storage buckets, no workers, no cron jobs
- Database migrations run as an explicit, approved step before a deploy, never during the
  build
- Requires a Stripe account (New Zealand) with one webhook endpoint for the dashboard's
  Checkout, refund, and dispute events. Test keys until go-live
- Requires a Resend account with a verified sender domain before contact email works in
  production; development can send from Resend's shared test sender. The same domain
  sends the dashboard's payment emails
- Custom domain: `mohamedhnoor.com`; `NEXT_PUBLIC_SITE_URL` must match it so canonical
  URLs, sitemap entries, social images, pay links, and Stripe redirects resolve correctly
- Deployment is an explicit, separately approved step. Nothing is pushed or deployed
  without a direct yes.
