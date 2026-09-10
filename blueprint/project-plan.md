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

## 2. Users - Who is this for?

Two buyer types, in the order they matter commercially:

**Primary, near term: clients hiring a Figma to Next.js build.** Typically a founder,
designer, or small agency with a finished design file and no front-end capacity. They are
evaluating on: can this person hit the design exactly, will it be responsive and fast, will
they communicate, and will it be delivered on time. Budgets are smaller and competition per
quality is lower, which makes this the fastest route to the first five-star reviews.

**Secondary, higher value: clients hiring for healthcare or fintech SaaS platforms.**
Typically a technical founder or product lead needing React, Next.js, Node, and Postgres
work on a regulated product. They are evaluating on: does this person understand access
control, auditability, and handling sensitive data, and can they work to a real
engineering standard. Higher budgets, more rigor expected, and a harder sell without
reviews, so the site positions for these without leading with them.

**Tertiary: recruiters and engineering managers** who arrive from LinkedIn or GitHub and
want a resume and a code-quality signal quickly.

All three arrive cold, often on mobile, often from a link pasted into a message thread. No
one is browsing. Every section has to earn the next scroll.

## 3. Features - What does the MVP need?

- Hero that states both specialisms in one sentence, Figma track first, with a primary
  call to action and a current availability status
- Credibility strip of demonstrable metrics, replacing invented client-count statistics
- About section: a short narrative of how the developer works and what they are good at
- Services: two named engagement tracks with scope, deliverables, and typical timeline
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

## 4. Data - What are we storing?

No database. All content is typed TypeScript modules under `src/content/`, imported at
build time so every page can be statically generated.

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

Server components by default. Client components only for the theme toggle, mobile
navigation, contact form, project filter, and animation wrappers.

## 6. Monetize - How will this make money?

Indirectly. The site does not sell anything. It converts cold traffic from proposals,
LinkedIn, and GitHub into qualified enquiries for freelance engagements in the two target
niches. Success is measured in enquiries that match those niches, not in visits.

The contact form captures project type, timeline, and an optional budget range so enquiries
arrive pre-qualified. No rates or prices appear anywhere on the site; pricing is a
conversation, and publishing it either anchors the developer low or filters out clients who
would have paid more.

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

## 8. Deployment - Where and how will this ship?

- Host: Vercel, as a standard Next.js App Router application
- Build command: `npm run build`, output served by Vercel's Next.js runtime
- All routes statically generated; the only server work is the contact Server Action
- Environment variables by name: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
  `CONTACT_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`
- No database, no storage buckets, no workers, no cron jobs
- Requires a Resend account with a verified sender domain before contact email works in
  production; development can send from Resend's shared test sender
- Custom domain to be decided; `NEXT_PUBLIC_SITE_URL` must match it so canonical URLs,
  sitemap entries, and social images resolve correctly
- Deployment is an explicit, separately approved step. Nothing is pushed or deployed
  without a direct yes.
