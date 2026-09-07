# Freelance Portfolio - Project Overview

<!-- blueprint:source-hash 8941c01de22bae0235a49e5248971392ab7fb8994b9b772362a292b6f28e13f6 -->

> A portfolio site that converts cold traffic into qualified freelance enquiries in
> two niches, for a developer with no reviews yet.

## Problem

A freelance developer with no completed jobs has to win work on evidence alone.
When a prospective client opens a proposal link, the site has seconds to answer
who this is, whether they can build this specific thing, and whether hiring is
safe.

Most developer portfolios fail that test: a generic tagline, self-assigned skill
percentages, and screenshots with no explanation of what was solved or what
changed. This site replaces social proof it does not have with proof it can
demonstrate, and presents every project as a case study rather than a picture.

The site is also a work sample, so its own performance and accessibility scores
are build gates rather than goals.

## Users

All arrive cold, often on mobile, from a link pasted into a message thread. No one
is browsing, so every section has to earn the next scroll. No authentication, no
access tiers: every visitor sees the same public site.

| User | Priority | Judging on |
|---|---|---|
| Client hiring a Figma to Next.js build | Primary, near term | Design fidelity, responsiveness, speed, communication, delivery time |
| Client hiring healthcare or fintech SaaS work | Secondary, higher value | Access control, auditability, sensitive-data handling, engineering standards |
| Recruiter or engineering manager | Tertiary | Resume and a fast code-quality signal |

## Features

In build-plan order. One line of purpose each; the spec is `/feature`'s job.

1. **Design system and app shell** - brand tokens over the shadcn base, font trio,
   header, mobile menu, footer, theme toggle, animation provider.
2. **Content layer** - the typed content contract every section reads, seeded with
   flagged placeholder data.
3. **Hero and about** - dual-track positioning with the Figma track first,
   availability status, credibility strip, and the about narrative. This is the
   first-impression gate: if it fails, nothing below it is read.
4. **Services** - the two engagement tracks with scope, deliverables, timeline, and
   how a project runs.
5. **Skills and experience** - stack grouped by role with usage context, and the
   dated experience timeline.
6. **Selected projects and index** - outcome-framed cards on the home page plus a
   filterable index route.
7. **Case study pages** - problem, approach, architecture, stack, and outcome per
   project. **Headline feature**: this is the whole differentiator against a
   template portfolio, and the main thing a client reads before enquiring.
8. **Resume** - print-optimized resume route from the content layer, plus a
   downloadable CV.
9. **Contact** - qualifying enquiry form with shared client and server validation,
   Server Action, Resend delivery, mailto fallback.
10. **SEO and social sharing** - per-route metadata and canonicals, sitemap, robots,
    generated social images, structured data.
11. **Accessibility and performance pass** - keyboard and screen reader pass, axe
    clean, reduced-motion pass, Lighthouse at or above 95, bundle and image budget.
12. **Deployment readiness** - Vercel config, env vars, production build
    verification, smoke tests.

Out of scope for the MVP: blog, CMS, analytics dashboards, testimonials (none
exist yet to publish), and any pricing display.

## Data model

**No database.** All content is typed TypeScript modules under `src/content/`,
imported at build time so every route can be statically generated. Types live in
`src/types/content.ts`.

> `Project` and `CaseStudySection` are locked shapes. Features 6, 7, and 10 all
> read them, including for social image generation and structured data. Change
> them before feature 6 or not at all.

### Profile (single record, `profile.ts`)

- `name` (string)
- `headline` (string) - one-sentence dual-track positioning, Figma track first
- `specialisms` (Service slug[]) - links to the service tracks
- `shortBio` (string), `longBio` (string[])
- `availability` ({ `status`: "available" | "limited" | "unavailable", `detail`: string })
- `location` (string)
- `links` ({ `email`, `github`, `linkedin`, `cv` } - all string)
- `proofPoints` (ProofPoint[]) - the credibility strip

### ProofPoint

- `value` (string) - for example "100/100"
- `label` (string) - what it measures
- `evidence` (string) - what backs the claim. Required, because no number ships
  without something to point at

### Service (`services.ts`)

- `slug` ("figma-to-nextjs" | "saas-platforms")
- `name`, `forWho`, `summary` (string)
- `deliverables` (string[])
- `typicalTimeline` (string) - no prices anywhere
- `process` (ProcessStep[]) - { `title`, `detail` }
- `order` (number)

### SkillGroup (`skills.ts`)

- `id`, `label` (string) - for example "Front end", "Data", "Practices"
- `skills` (Skill[]) - { `name`, `context` (string, where it was actually used),
  `icon` (optional key into `src/components/icons/`) }
- No proficiency percentages by design

### Role (`experience.ts`)

- `id`, `company`, `title` (string)
- `start` (string, `YYYY-MM`), `end` (string `YYYY-MM` | "present")
- `summary` (string)
- `impact` (string[])
- `stack` (string[])

### Project (`projects.ts`)

- `slug` (string) - the route segment for `/projects/[slug]`
- `title`, `summary`, `role`, `period` (string)
- `category` (Service slug) - drives the index filter and ties a project to the
  track it demonstrates
- `stack` (string[])
- `featured` (boolean) - selects it for the home page
- `isPlaceholder` (boolean) - seeded example content
- `links` ({ `live`?, `repo`? })
- `metrics` (Metric[]) - { `label`, `value`, `evidence` }
- `cover` ({ `src`, `alt`, `width`, `height` })
- `caseStudy` (CaseStudySection[])

> `isPlaceholder: true` marks fictional seeded content. No project may reach
> production with it set; feature 12 blocks on this.

### CaseStudySection

- `heading` (string) - fixed order: Problem, Approach, Architecture, Outcome
- `body` (string[]) - paragraphs
- `bullets` (string[], optional)

### ContactSubmission (validated, never stored)

- `name`, `email`, `message` (string)
- `projectType` ("figma-conversion" | "saas-build" | "other")
- `timeline` (string)
- `budgetRange` (string, optional) - aids scoping, never displayed publicly
- `company` (string) - honeypot, must be empty

One Zod schema in `src/lib/validation/contact.ts` is shared by the client form and
the Server Action. Submissions are forwarded by email and never persisted.

## Tech stack

- **Next.js 16 (App Router)** - static generation for every route; the only server
  work is the contact Server Action
- **React 19 with the React Compiler** - no hand-written memoization
- **TypeScript (strict)** - content modules typed so a malformed entry fails the build
- **Tailwind CSS v4** - CSS-first config, design decisions as CSS variables
- **shadcn/ui on Radix** - interactive primitives, retuned to the brand palette
- **Motion** - animation, code split via LazyMotion, reduced-motion aware
- **react-hook-form + Zod** - contact form, one schema for client and server
- **Resend** - transactional email from the Server Action
- **Vitest** - logic tests, to be added before feature 9
- **Playwright MCP** - browser verification during the build
- **Git and GitHub** - with a Verify command wired to checks via `/ci`

## Monetization

Indirect. The site sells nothing. It converts cold traffic from proposals,
LinkedIn, and GitHub into qualified enquiries in the two target niches. Success is
enquiries that match those niches, not visits.

No rates or prices appear anywhere; publishing them either anchors low or filters
out clients who would have paid more. The form captures project type, timeline,
and an optional budget range so enquiries arrive pre-qualified.

## UI/UX

Reference: `design/website-ui-design.png`. Dark, layered near-black surfaces with a
violet accent, a code-editor motif in the hero, eyebrow-and-heading section rhythm,
card-based content blocks. Confident and technical, not playful. Dark is the
default theme; light is a supported option and both must keep working.

Deliberately changed from the reference:

- Client-count and satisfaction statistics removed - false for an account with no
  completed jobs, and a client who cross-checks sees the mismatch
- Skill percentage bars removed - self-assigned scores are filler
- Blog navigation removed - an empty blog is a negative signal
- Services section, experience timeline, and case study pages added - the reference
  has none, and all three are load-bearing for these buyers

Typography moves off the scaffold default to a display, body, and monospace trio.
Motion is used for staged entrances and scroll reveals, on transform and opacity
only, collapsing under `prefers-reduced-motion`, and never on the largest
contentful heading.

Accessibility is a service the site sells, so it has to pass its own claim: WCAG AA
contrast, full keyboard operation, correct landmarks and heading order, form errors
wired to their inputs.

### Routes

- `/` - hero, credibility strip, about, services, selected projects, skills,
  experience, contact. Projects sit above skills: proof of delivery outranks a
  technology list for a buyer with no reviews to read
- `/projects` - full index, filterable by category and stack
- `/projects/[slug]` - case study, one static page per project
- `/resume` - print-optimized CV
- `/sitemap.xml`, `/robots.txt`, generated `opengraph-image`, and a 404 page

## Deployment

- **Host:** Vercel, standard Next.js App Router application
- **Build:** `npm run build`, served by Vercel's Next.js runtime
- **Routes:** all statically generated; only the contact Server Action runs server-side
- **Env vars:** `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`,
  `NEXT_PUBLIC_SITE_URL`
- **No** database, storage buckets, workers, or cron jobs
- **Prerequisite:** a Resend account with a verified sender domain before contact
  email works in production; development can use Resend's shared test sender
- **Health check:** not applicable, static hosting
- Deployment is explicit and separately approved. Nothing is pushed or deployed
  without a direct yes.

## Open questions

> Resolve in the plans, then re-run `/overview`.

- **Custom domain undecided.** `NEXT_PUBLIC_SITE_URL` must match the final origin
  or canonical URLs, sitemap entries, and social images will resolve wrong. Needed
  by feature 10, blocking for feature 12.
- **Real identity and content not supplied.** Every content module ships seeded and
  flagged. Real profile copy, projects, experience, and the CV file are needed
  before launch, not before the build starts.
- **Resend sender domain not verified.** Free account plus DNS verification, and
  DNS propagation is the slow part. Worth starting well before feature 9.
- **No test runner configured yet.** `AGENTS.md` declares no test command, so there
  is no test gate. The plan adds Vitest before feature 9; until then logic is
  verified by build and browser evidence.
