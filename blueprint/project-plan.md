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

This site solves that by being a conversion page rather than a gallery. It says in the
first screen what the developer builds and for whom, presents each project as a full case
study, and substitutes demonstrable proof (test counts, Lighthouse scores, Core Web
Vitals, accessibility conformance) for the social proof a new account does not have yet.
It reads as the business of a serious independent developer: business problems first,
technology in support. The conversion path it is built around is Google, LinkedIn or
GitHub, then the portfolio, then a case study, then Start a Project, then an enquiry.

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

The site is the portfolio of a full-stack web developer in Wellington, New Zealand, who
builds websites and custom web applications. It speaks to four kinds of client, in the
order the site presents them, all of whom want to deal directly with the developer
building their product:

**Businesses** that need a professional website or custom software that fits the way the
business actually operates. They are evaluating on credibility, reliability and clear
communication.

**Startups** with a product idea that needs to become a working MVP and then a product
ready for production. They are evaluating on whether authentication, tenant isolation,
payments and tests are in place rather than bolted on later; the travel platform case
study is the evidence.

**Agencies** with client projects and Figma designs that need turning into
production-ready sites and applications, white-label if they need it, with the agency's
name on the work and the client relationship left with the agency. There is no agency
engagement to show yet, so this rests on the build standard this site itself proves.

**Entrepreneurs** with an idea and no one to handle the technical implementation, from
frontend to backend.

**Also: recruiters and engineering managers** who arrive from LinkedIn or GitHub and want
a resume and a code-quality signal quickly.

The market is New Zealand, Australia and international. Local relevance matters to New
Zealand and Australian buyers, so Wellington is stated plainly, but the site never implies
existing clients in any country.

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

The home page, in order. Each section is a scannable summary linking to its own page:

- Hero: the role and location, the headline "Websites and Web Applications Built for Your
  Business" with "Your Business" highlighted, what the developer builds, Start a Project
  and View My Work, availability, the primary stack, and a showcase of delivered projects
  on screens as visual proof of work
- Four value points under the hero: full-stack, production-ready, direct communication,
  New Zealand based
- What I Can Build: four services, business websites, custom web applications, SaaS
  development, and Figma to production, each with what it suits or can include and its
  own call to action, which opens the enquiry form with that project type chosen
- Who I Work With: businesses, startups, agencies, entrepreneurs
- Selected Work, framed by outcome with the measurement behind every number
- Why Work With Me: seven reasons, from full-stack development to code ownership
- How I Work: a seven-step process from discovery to handover
- Technology I Work With, grouped by purpose (frontend, backend, database, data and ORM,
  authentication, payments and integrations, deployment and infrastructure)
- About, then Based in New Zealand, Working Globally, then a final call to action

Pages and the rest of the site:

- Navigation: Home, Services, Work (`/projects`), Process, About, Contact, with a Start a
  Project button on every page, including the mobile menu. Skills, experience and the
  resume keep their pages and are linked from About
- Case studies in ten parts: overview, the problem, the solution, key features,
  architecture, engineering challenges, testing, technology, my role, and outcome, each
  ending in a Start a Project call to action
- `/process`: the seven steps in full and a milestone-based model, with the milestones and
  payment schedule agreed per project and no percentages published
- A project index filterable by service and technology
- Technical skills grouped by purpose, with the context each was used in
- Professional experience as a dated timeline, and a resume written for recruiters and
  employers rather than clients: a standalone page without the site navigation, which
  prints to A4, plus a downloadable CV
- Contact: "Have a Project in Mind?", with a form asking for name, email, company, what is
  being built (eight project types), a description, whether a design exists, an optional
  budget range, and a timeline, plus a direct email address. Every enquiry gets a reply
  within one business day
- Light and dark themes, with dark as the default
- Full metadata, sitemap, robots, generated social images, and structured data

Explicitly out of scope: a blog, a CMS, analytics dashboards, testimonials and client
logos (there are none yet to publish), and any pricing display other than the optional
budget brackets in the enquiry form.

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

- `profile` - name, role, headline and the phrase in it that is highlighted, short and
  long bio, the primary stack, availability status, location, service area, the About
  portrait and the hero showcase image, social and contact links
- `services` - slug, name, summary, one or two labelled lists, a call to action with the
  project type it preselects, and a typical timeline only where one has been promised
- `approach` - the value points, audiences, reasons to hire, process steps and milestones
- `skills` - groups by purpose with per-technology usage context, and which ones the home
  page features and the resume lists
- `experience` - roles with company, title, period, summary, and impact points
- `resume` - the same history told to an employer: a title, a summary, experience and
  training entries that take their dates from `experience`, and project entries that take
  their stack from `projects`. It may only name a technology `skills` has evidence for
- `projects` - slug, product name, title, summary, role, period, stack, featured flag,
  links, outcome metrics, a placeholder flag, and the ten case study sections
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
navigation, contact form, project filter, the technology row's pause control, the
resume's print button, and animation wrappers on the public site, and
for forms, the task list, and dialogs in the dashboard.

## 6. Monetize - How will this make money?

Indirectly. The site does not sell anything. It converts traffic from search, LinkedIn,
GitHub and proposals into qualified project enquiries for websites and web applications.
Success is measured in enquiries, not in visits.

The contact form captures the project type, whether a design exists, a timeline, and an
optional budget range so enquiries arrive pre-qualified. The budget question offers NZD
brackets, from under NZ$5,000 to NZ$60,000 or more, plus "not sure yet". Those brackets
are the only figures on the site and are never rendered anywhere else. No rates or prices
appear; pricing is a conversation, and publishing it either anchors the developer low or
filters out clients who would have paid more. Larger projects are split into milestones
agreed before development begins, and the site describes that model without percentages.

The business dashboard does not change this. It collects payment for engagements already
agreed, through the developer's own Stripe account, with no fees or commissions added.
Amounts appear only inside the dashboard and on a client's own pay page, never on the
public site.

## 7. UI/UX - How should this look and feel?

Reference: `design/website-ui-design.png`. Dark, layered near-black surfaces with a violet
accent, a showcase of delivered projects in the hero, section eyebrow labels, and
card-based content blocks. Confident and technical, not playful.

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
