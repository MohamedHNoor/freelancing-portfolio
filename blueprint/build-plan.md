# Build Plan

The features that make up this project, in build order. Detail lives in each feature spec,
not here. Completed items get checked off, so this doubles as the progress tracker.

Two setup steps sit between features rather than being features themselves. `/tests` is
done: Vitest runs from feature 5 onward and the gate is on. `/ci` still needs running
before feature 13, so a `Verify` command exists for automatic checks.

## MVP

- [x] 1. **Design system and app shell** - brand tokens over the shadcn base, font trio,
  header with navigation, mobile menu, footer, theme toggle, and the animation provider
- [x] 2. **Content layer** - typed profile, services, skills, experience, and project data
  with lookup helpers, seeded with clearly flagged placeholder content
- [x] 3. **Hero and about** - positioning that names the service tracks, availability
  status, credibility strip, and the about narrative
- [x] 4. **Services** - the engagement tracks with scope, deliverables, timeline, and how a
  project actually runs
- [x] 5. **Skills and experience** - technology stack grouped by role with usage context,
  and the dated experience timeline
- [x] 6. **Selected projects and index** - outcome-framed project cards on the home page
  plus a filterable project index route
- [x] 7. **Case study pages** - a static page per project covering problem, approach,
  architecture, stack, and outcome, with previous and next navigation
- [x] 8. **Resume** - print-optimized resume route rendered from the content layer, plus a
  downloadable CV
- [x] 9. **Section detail pages** - /about, /services, /skills and /experience as
  standalone routes carrying the full content, with each home section reduced to a
  scannable summary that links to its page, and primary navigation pointing at the
  routes rather than at home page anchors
- [x] 10. **Contact** - qualifying enquiry form with shared client and server validation,
  Server Action, Resend delivery, and a mailto fallback
- [x] 11. **SEO and social sharing** - per-route metadata and canonicals, sitemap, robots,
  generated social images, and structured data
- [x] 12. **Accessibility and performance pass** - keyboard and screen reader pass, axe
  clean, reduced-motion pass, Lighthouse at or above 95, bundle and image budget
- [x] 13. **Deployment readiness** - Vercel configuration, environment variables, production
  build verification, and a smoke test list

## Post-MVP

- [x] 14. **Real projects replace the placeholders** - two case studies: TravelGrid Africa
  for the startup SaaS track, and this portfolio site itself for the Figma to Next.js
  track. Screenshots, outcome-framed metrics with real evidence, and the
  removal of all three seeded placeholders, which is what lets a production build pass the
  deploy gate

Still candidates, once the site is live and the first reviews are in: a writing section if
there is something worth publishing, and testimonial quotes once there are genuine ones to
quote.

## Business dashboard

A private, owner-only tool for running the work once it is won. The schema, state
machines, payment flow, and rules every item below builds on are in
`blueprint/dashboard-architecture.md`.

- [x] 15. **Site and dashboard separation** - the public pages move into their own route
  group with their URLs, static generation, budgets, and behaviour unchanged; the root
  layout keeps only the document shell, and robots and the CSP learn the private paths
  and Stripe Checkout. The route group itself shipped early with the resume rework
  (`blueprint/history/fixes/recruiter-resume.md`): the pages are in `(site)` and `/resume`
  deliberately stays outside it. Still to do: robots, the CSP, and moving `MotionProvider`
  and `SkipLink` out of the root layout if the dashboard should not carry them
- [ ] 16. **Owner sign-in** - the Neon and Prisma foundation, email and password
  sign-in through Neon's Managed Better Auth with verification and reset emails sent
  through Resend, sign-up closed so only the owner's account exists, and the protected
  dashboard shell
  - [x] 16a. **Database foundation** - lazy server environment validation, Neon
    connections, and Prisma configuration with offline client generation, without
    exposing authentication routes. First shipped on Drizzle with a self-hosted
    Better Auth schema; moved to Prisma, with the auth tables handed to Managed
    Better Auth, by the `fix/prisma-neon-auth` change
  - [x] 16b. **Owner authentication** - Managed Better Auth enabled per Neon branch
    with sign-up closed, the owner account, verification and password-reset emails
    through Resend SMTP, sessions, auth server actions, and owner-only
    authorization tests
  - [ ] 16c. **Auth screens and dashboard shell** - accessible auth forms,
    protected dashboard navigation, loading and error states, and browser
    verification using the existing design system
- [ ] 17. **Clients** - create, edit, archive, and list clients with their currency and
  billing details, on exact integer money handling and an append-only activity log
- [ ] 18. **Projects and payment plans** - projects with a total and a currency;
  percentage, fixed, or mixed milestone plans with the deposit as an upfront milestone;
  plans that must balance exactly before a project activates; and the project page with
  separate development and payment progress
- [ ] 19. **Tasks and milestone completion** - tasks inside each milestone with status,
  reordering, and computed progress, a ready-for-completion state, manual milestone
  completion and reopening, and the project activity timeline
- [ ] 20. **Payment requests and Checkout** - request payment for a billable milestone, a
  stable private pay link and Review & Pay page that opens Stripe Checkout, request and
  reminder emails, and cancelling or retrying a request
- [ ] 21. **Payment confirmation** - a signature-verified, idempotent Stripe webhook as the
  only path that marks money received, payment records, refunds and disputes, owner
  notifications, the success page, and a server-side Sync with Stripe fallback
- [ ] 22. **Business overview and payments** - the dashboard home with value, paid,
  outstanding, and requested totals per currency, pending requests, upcoming deadlines,
  and recent payments and milestones, plus the filterable payments list
- [ ] 23. **Dashboard hardening and launch** - two-factor sign-in and session management,
  error monitoring, the end-to-end payment test, Stripe reconciliation and database
  backups, and the production setup for Stripe, Resend, and Neon
