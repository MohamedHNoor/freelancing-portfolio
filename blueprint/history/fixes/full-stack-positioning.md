# Fix: Full-stack positioning and content update

**Type:** Fix

**Branch:** fix/full-stack-positioning

**Status:** verified

## The problem

The site sells three narrow tracks (white-label for agencies, startup SaaS, Figma
to Next.js) with agency and startup copy throughout. The owner's brief repositions
it as a full-stack web development business for businesses, startups and agencies
in New Zealand, Australia and internationally, with one conversion path:

Google / LinkedIn / GitHub → portfolio → case study → Start a Project → enquiry.

Content only: the visual design, the hero's code card and technology row, and the
existing components stay. Nothing may be invented, and the TravelGrid case study
has drifted from its repository (frontend now Next.js 16, sessions now Better
Auth, the 234-test figure is stale).

## The fix

- **Services:** four, replacing the three tracks: business websites, custom web
  applications, SaaS development, Figma to production. Timelines only where one
  already existed; the white-label terms move to the Agencies audience
- **Home, in the brief's order:** hero, value points, what I build, who I work
  with, selected work, why work with me, process, technology, about, location,
  final call to action. Each section is a summary that links to its page
- **Navigation:** Home, Services, Work (`/projects`), Process (new `/process`),
  About, Contact, plus a Start a Project button. Skills, Experience and Resume
  keep their routes and are linked from About and the footer
- **Case studies:** ten sections (Overview, The Problem, The Solution, Key
  Features, Architecture, Engineering Challenges, Testing, Technology, My Role,
  Outcome) from existing copy and TravelGrid's README, every metric re-verified,
  and a Start a Project block at the end of each
- **Contact form:** company, eight project types, existing design, NZD budget
  brackets, five timeline options, "Send Project Enquiry". The honeypot is
  renamed, since `company` becomes a real field
- **SEO:** the brief's titles and descriptions, the social image tagline, `/process`
  in the sitemap
- **Plans:** `project-plan.md` positioning and the no-prices rule (budget brackets
  allowed in the form only), `AGENTS.md`, `README.md`

Must not break: static generation of every public route, the CSP, the contact
action's fail-closed and idempotency behaviour, the deploy gate, AA contrast, and
the budgets in `AGENTS.md`.

## Build steps

1. **Content model** - types, invariants and content modules for services,
   audiences, reasons, process, milestones and value points. Done when `npm test`
   passes with the new invariants.
2. **Case studies** - both projects in ten sections with verified metrics, and a
   Start a Project block on every case study. Done when both render and every
   number traces to a source.
3. **Home and pages** - the home sections in order, `/process`, and the services,
   about, work and contact pages. Done when every route builds static.
4. **Navigation and footer** - nav items, Start a Project button, footer. Done when
   the sitemap guard and nav tests pass.
5. **Contact form** - new fields, honeypot rename, email body. Done when the
   schema and action tests pass.
6. **SEO** - metadata, social image, structured data. Done when the SEO tests pass.
7. **Plans and docs** - project plan, `AGENTS.md`, README.
8. **Independent review repairs** - F-09 to F-13 from the first independent review:
   background links in the footer, an `h2` and no `Reveal` on `/process`, the
   leftover "Track" label and stale text, and a testable service sort. The
   enquiry honeypot also asks password managers not to fill it, and the seven
   steps on `/process` and the reasons on `/` end on a Start a Project card
   instead of an empty grid slot. Done when the findings are fixed and a fresh
   independent review passes.

## Verify

- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` (every public
  route static in the route table)
- Browser pass over every route in both themes and at phone width, axe clean
- Re-measure home and case study transfer sizes against the `AGENTS.md` budgets
- Submit the contact form in development and confirm the new fields arrive

## Verification results (2026-10-05)

| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npm run lint` | Clean |
| `npm test` | 336 tests in 15 files, all passing |
| `npm run build` and `npm run preflight` | Every public route static, `/process` included |
| axe, WCAG 2.1 A and AA | 0 violations on 11 routes in both themes, plus the open mobile menu and the contact form showing its errors |
| Lighthouse 13.4, mobile, two runs | `/` 88 and 90, case study 95 and 95, `/contact` 90 and 93; accessibility, best practices and SEO 100 |
| LCP in a real browser, mobile viewport | 88 ms on `/`, 76 ms on a case study and `/contact`, CLS 0 |
| Transfer budgets | JS 263.9 to 269.6 KB, totals 438 to 500 KB, fonts 109.5 KB, CSS 13.1 KB, all under ceiling |
| Conversion path | Case study, Start a Project, `/contact?type=saas-product` with SaaS Product preselected |

TravelGrid's numbers were re-run against its repository the same day: 357 backend
tests across 39 suites and 739 frontend tests across 69 files, all passing.

Not done here: `project-overview.md` still describes the agency and startup positioning
and needs `/overview` re-run. The contact form was not submitted to Resend, because
delivery needs the production keys.

## Findings

### full-stack-positioning/F-06 [P3] closed - The fallback comment on /contact is contradicted by its own commit

**File:** src/app/contact/page.tsx:34
**Found:** 2026-09-09 by /audit (scope: current; lens: quality)
**Why it matters:** The comment states the fallback "renders only when an address
is supplied, which is not the case today: every value in `profile.links` is the
empty string." The same commit sets `email`, `github` and `linkedin` to real
values in src/content/profile.ts:33, and the served page at
http://localhost:3000/contact does render `mailto:info@mohamedhnoor.com`. A
comment that is actively wrong about the code beside it is worse than none, and
this one describes the feature's headline open risk as still open when the commit
closed it. The same claim is carried in the spec's "Carried forward" section.

**Suggested fix:** Cut the "which is not the case today" clause and the sentence
after it; the first line already says everything the reader needs. Update the
spec's Carried forward note in the same edit.
**Resolution:** Fixed in step 10. The `/contact` comment now states that an address is supplied and explains why the guard remains (an empty value must render nothing rather than a dead `mailto:`). The identical stale claim in `src/app/resume/page.tsx` was corrected in the same step; the reviewer cited one instance but it was one defect in two files. The spec's live-tense claim was rewritten to record that the fallback problem was resolved during the feature.

**Re-reviewed 2026-09-09 by /audit (independent; scope: current; lens: quality, security, performance, tests): not closed.** The two code comments are repaired and verified. `src/app/contact/page.tsx:34-38` and `src/app/resume/page.tsx:30-33` now describe the tree, and the running dev server confirms the behaviour they claim: `/contact` returns 200 and renders `mailto:info@mohamedhnoor.com`.

The spec half of the repair was not done, and this finding's own Suggested fix named it ("Update the spec's Carried forward note in the same edit"):

- `blueprint/context/current-feature.md:458-461` still reads "**The fallback still renders nothing.** `profile.links.email` is the empty string, so a visitor who hits the failure path has no way to make contact." The same delta sets `email: "info@mohamedhnoor.com"` at `src/content/profile.ts:33`, so the claim is false in the tree it ships with.
- `blueprint/context/current-feature.md:348-352` now contradicts itself inside one paragraph: "**Resolved during the feature:** a real address was supplied, and the fallback now renders. Until the user supplies a real address, a visitor who hits the fail-closed path has **no way to make contact at all**". The repair inserted the first sentence and left the second standing.

Step 10's done-when was "neither statement is contradicted by the tree", and one still is. The defect is the same one F-06 describes, a stale claim about the fallback, so this keeps its existing ID rather than gaining a new one. Stays `fixed`. P3, so it does not block `/complete`.

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; lens: quality, security, performance, tests; d9304aa..c3db156): closed.** `src/app/contact/page.tsx` is in this delta and was re-read: the comment at lines 36-40 says an address is supplied and why the guard stays, and the built `/contact` page renders `mailto:info@mohamedhnoor.com`. `src/app/resume/page.tsx:30-33` still describes the tree. The live spec is now `fix/full-stack-positioning`, and `blueprint/context/current-feature.md` carries no claim about the fallback at all (no match for "fallback", "renders nothing" or "no way to make contact"), so the stale spec half no longer exists in the tree. No new defect introduced by the repair.

### full-stack-positioning/F-09 [P2] closed - The footer does not link Skills, Experience and Resume, which the spec requires

**File:** src/components/layout/Footer.tsx:58
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: quality)
**Why it matters:** The spec's fix says "Skills, Experience and Resume keep their
routes and are linked from About and the footer." The footer's page list is
`NAV_ITEMS` and nothing else, and `NAV_ITEMS` no longer contains those three
routes. In the built output, every route's footer links only `/`, `/about`,
`/contact`, `/process`, `/projects` and `/services`. `/experience` and `/resume`
are now linked from `/about` alone, and `/skills` from `/about` and the home
technology section. The spec is marked `verified`, but build step 4's done-when
("the sitemap guard and nav tests pass") cannot see the footer, so the gap went
unnoticed. The resume is the page a recruiter or client prints. It is now one
page away from the rest of the site instead of on every page.
**Suggested fix:** Add a second, short footer list for the background pages
(Technology, Experience, Resume), kept as its own constant beside `NAV_ITEMS` in
`src/lib/site.ts` so the sitemap guard can cover it. If leaving them out of the
footer was deliberate, amend the spec's Navigation bullet instead. One of the two
has to change so that the spec matches the tree.
**Resolution:** Added `BACKGROUND_LINKS` (Technology, Experience, Resume) beside `NAV_ITEMS` in
`src/lib/site.ts`. The footer renders both lists and `AboutDetail` reads the same
constant. `assertRoutesCoverNavigation` now covers both by default, with a test
proving a missing `/resume` route throws. The spec's Navigation bullet now holds.

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; lens: quality, security, performance, tests; d9304aa..ee226e0): closed.** `src/lib/site.ts:152-156` defines `BACKGROUND_LINKS` (Technology, Experience, Resume); `src/components/layout/Footer.tsx:58` renders `[...NAV_ITEMS, ...BACKGROUND_LINKS]`; `src/components/detail/AboutDetail.tsx` reads the same constant. In the prerendered build every one of the 11 public routes has a footer linking `/skills`, `/experience` and `/resume`. `src/lib/seo.ts:74` defaults the guard to both lists, and `tests/lib/seo.test.ts` proves a missing `/resume` throws. No new defect from the repair.

### full-stack-positioning/F-10 [P2] closed - /process jumps from its h1 straight to h3

**File:** src/app/process/page.tsx:35
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: quality)
**Why it matters:** `PointGrid` renders each point as an `h3`. Its docstring says
it belongs "under its section's `h2`", and on the home page it is used that way.
On `/process` it sits directly under `PageHeader`'s `h1`, so the built page's
outline is `h1, h3 x7, h2, h3 x4`. `coding-standards.md` requires "One `h1` per
page and a correct heading order" and treats an accessibility violation as a
bug. The spec's axe pass ran the WCAG 2.1 A and AA rule sets, and axe tags
`heading-order` as best practice, so that run could not catch this. Lighthouse
does audit heading order, but it was run only on `/`, a case study and
`/contact`. Every other page in the build keeps a correct outline.
**Suggested fix:** Give the steps grid an `h2`, either a visible one such as
"Seven steps" to match the milestones section below it, or an `sr-only` one.
Alternatively, let `PointGrid` take the heading level as a prop.
**Resolution:** `/process` wraps the steps grid in a section with a visually hidden `h2`, "The
seven steps", so the outline is `h1, h2, h3 x7, h2, h3 x4`.

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; lens: quality, security, performance, tests; d9304aa..ee226e0): closed.** `src/app/process/page.tsx:35-50` wraps the steps in a `section` labelled by an `sr-only` `h2`. The prerendered `/process` outline is `h1, h2, h3 x7, h2, h3 x4`, and no route in the build skips a heading level. The repair itself is sound; the call to action added to the same list in the same step is a separate defect, recorded as F-15.

### full-stack-positioning/F-11 [P2] closed - /process server-renders all of its content at opacity 0

**File:** src/components/primitives/PointGrid.tsx:43
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: performance)
**Why it matters:** `PointGrid` wraps every card in `Reveal`, which
server-renders `initial={{ opacity: 0, y: 16 }}`. The project keeps `Reveal` off
content pages on purpose. `ServicesDetail`, `AboutDetail` and `CaseStudySection`
each say so ("Reveal server-renders `opacity: 0`, so wrapping it would make the
content depend on JavaScript having run"), and `/process`'s own comment
invokes the same rule ("the content is the reason this page exists"). It then
renders all of that content through `PointGrid`. The built `/process.html` has
11 `opacity:0` inline styles in `<main>`, one for each step and milestone card.
`/services.html` has none. If the client bundle fails to load or hydrate (a
blocked script, a CSP regression, a chunk error), `/process` shows its header and
closing call to action over an empty middle. Even when the bundle works, every
card waits for hydration plus an intersection callback before it becomes
visible. This page is in the primary navigation.
**Suggested fix:** Add a `reveal` prop to `PointGrid`, defaulting to `true` for
the home sections, and pass `false` on `/process`. The page then follows the
same rule as the other detail pages.
**Resolution:** `PointGrid` takes a `reveal` prop, defaulting to `true` for the home sections.
`/process` passes `false` for both grids, so its content no longer ships at
`opacity: 0`.

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; lens: quality, security, performance, tests; d9304aa..ee226e0): closed.** `src/components/primitives/PointGrid.tsx:19,36,53` adds `reveal` (default `true`) and renders the card bare when it is `false`; `src/app/process/page.tsx:47,64` passes `false` to both grids. The prerendered `/process` has 0 `opacity:0` styles inside `<main>` (as do `/services`, `/about` and both case studies); the home page keeps its intended `Reveal`s, and its `h1` precedes the first `opacity:0`. No new defect from the repair.

### full-stack-positioning/F-12 [P3] closed - A visible "Track" label and three text spots still describe the replaced positioning

**File:** src/components/projects/ProjectFilter.tsx:77
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: quality)
**Why it matters:** The fix replaces the three tracks with four services, but a
few spots were left behind:

- `src/components/projects/ProjectFilter.tsx:77`: the `/projects` filter group
  is still labelled "Track" on the live page, and it filters by service. The
  README describes it as "filterable by service".
- `src/lib/seo.ts:8`: "`/` is not in the navigation" is now false, because
  `NAV_ITEMS` starts with Home.
- `src/components/projects/CaseStudySection.tsx:19`: "the four stages" is now
  ten sections.
- `AGENTS.md`, Budgets prose: "JS drifted from feature 12's 243 KB to 260.5 KB
  across the two repositionings" contradicts the table directly above it, which
  reports 263.9 to 269.6 KB after the second repositioning.

**Suggested fix:** Label the facet "Service" and correct the three text spots.
**Resolution:** The `/projects` filter group is labelled "Service" (`filter-service`). The
`seo.ts` and `CaseStudySection` comments are corrected, and the `AGENTS.md`
budget prose now gives 260.5 KB for the first repositioning and 263.9 to
269.6 KB for the second, matching its table.

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; lens: quality, security, performance, tests; d9304aa..ee226e0): closed.** All four cited spots are corrected: `src/components/projects/ProjectFilter.tsx:77` labels the group "Service" (`filter-service`), `src/lib/seo.ts:8-14` no longer claims `/` is outside the navigation, `src/components/projects/CaseStudySection.tsx:19` says "ten sections", and the `AGENTS.md` Budgets prose matches its table. A further stale description on `/resume`, which this finding did not cite, is recorded separately as F-14.

### full-stack-positioning/F-13 [P3] closed - The getServices ordering test no longer proves the sort

**File:** tests/content/index.test.ts:200
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: tests)
**Why it matters:** The test is named "orders by the order field rather than
array order". It used to rely on a seed that listed order 2 before order 1. The
new `src/content/services.ts` lists orders 1 to 4 in array order, and the test
now asserts only that the output is sorted and that the first slug is
`business-websites`. Both still hold if the sort at `src/content/index.ts:155-157`
is deleted, so the test passes without exercising what its name claims.
**Suggested fix:** Extract the sort into a small pure function, such as
`orderServices(services)`, and test it with an out-of-order fixture, the way
`assertContentInvariants` takes fixtures. Or rename the test to say what it now
checks.
**Resolution:** The sort is now the exported pure function `orderServices`, tested against an
out-of-order fixture and for not mutating its input. The `getServices` test was
renamed to what it checks.

**Re-reviewed 2026-10-05 by /audit (independent; scope: current; lens: quality, security, performance, tests; d9304aa..ee226e0): closed.** `src/content/index.ts:157-161` exports `orderServices`, and `orderedServices` is built from it. `tests/content/index.test.ts:200-226` feeds it orders 3, 1, 2 and asserts an explicit slug sequence, so deleting the sort now fails the test; a second case proves the input is not mutated. The `getServices` test is renamed to "returns the shipped services in order" and asserts only what it says. No new defect from the repair.

## Independent review

**Status:** passed
**Target commit:** ee226e0f0a3d6321e28bb0f8092c5459d8a0bde6
**Base commit:** d9304aa814a8c6e356b8c6f253af11fda4976a79
**Base ref:** main
**Spec hash:** 00738c41cb7e3bccfe59acad66c655959578a6b48891fb58bc389ff9b510ce1a
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-10-05T06:48:21Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-05T07:18:01Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `d9304aa814a8c6e356b8c6f253af11fda4976a79..ee226e0f0a3d6321e28bb0f8092c5459d8a0bde6` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

### Commands

- `git rev-parse HEAD`: pass, equals Target commit
- `git merge-base main ee226e0f0a3d6321e28bb0f8092c5459d8a0bde6`: pass, equals Base commit (`main` is itself at the base)
- `shasum -a 256 blueprint/context/current-feature.md`: pass, equals Spec hash
- `git status --porcelain -uall`: pass, only `blueprint/context/findings.md` and `blueprint/context/review.md` differ, before and after the build
- `npx tsc --noEmit`: pass, no output
- `npm run lint`: pass, no warnings
- `npm test`: pass, 336 tests in 15 files; no `.only`, `.skip` or `.todo` in `tests/`
- `npm run build`: pass, every public route static (`/process` included), both case studies SSG
- `npm run preflight`: pass, `VERCEL_ENV=production` build exits 0 with the same static route table
- Lighthouse, axe and transfer-size measurement: unavailable, no browser or long-running server in this review

### Evidence

- Delta reviewed in full: 72 files across `src/` (actions, validation, content, types, lib, pages, layout, sections, primitives, projects), `tests/`, `AGENTS.md`, `README.md`, `blueprint/project-plan.md`, `blueprint/dashboard-architecture.md`; binary screenshots and the re-captured cover checked for size only (28 to 47 KB, under the 80 KB source ceiling)
- Spec coverage: nav is Home, Services, Work, Process, About, Contact plus a Start a Project button in the header and mobile menu; home sections render in the brief's order; both case studies carry the ten canonical headings (enforced by `assertContentInvariants`) and end in `CaseStudyCta`; the form has company, eight project types, existing design, six NZD budget options, five timelines and "Send Project Enquiry"; the sitemap lists `/process`
- Security: `submitContact` still judges the honeypot (now `website`) on the raw value before parsing, re-parses with the shared schema, fails closed on missing config, logs no payload or provider string, and keeps `name` out of headers except through `formatFromHeader`; `company` is length-bounded, plain-text only, and included in the idempotency hash; `projectTypeFromQuery` and `enquiryHref` accept only fixed slugs; no CSP or security-header change in the delta
- Prerendered build: no route skips a heading level (`/process` is `h1, h2, h3 x7, h2, h3 x4`); 0 `opacity:0` styles inside `<main>` on `/process`, `/services`, `/about` and both case studies; on `/` the hero `h1` precedes the first `opacity:0`; every route's footer links `/skills`, `/experience` and `/resume`; the hero's `#work` anchor resolves
- Contrast: muted text on the new `StartProjectCard` tint computes to 5.91:1 (light) and 7.51:1 (dark), above AA
- Content honesty: service timelines match the two promised before this delta; the 336 test count matches `npm test`; TravelGrid's 39 backend suites and 69 frontend test files, Next.js 16, Better Auth, Express 5, Paystack HMAC-SHA512, Cloudinary and Railway all trace to `../travel_grid_api` (read only); 357 + 739 = 1,096
- Ledger re-examination: F-09, F-10, F-11, F-12 and F-13 moved from `fixed` to `closed` on code and build evidence; F-07 and F-08 re-confirmed open, unchanged by the repair

### Findings

- F-14 [P2] open: `/resume` meta, Open Graph and Twitter descriptions still carry the replaced three-track positioning (`src/app/resume/page.tsx:20`)
- F-15 [P3] open: the "seven steps" `ol` on `/process` exposes eight items, the eighth being the call to action (`src/components/primitives/PointGrid.tsx:57`)
- F-16 [P3] open: the one-business-day reply promise is hard-coded in five strings, and `FinalCta`'s comment says to change it "in both places"
- F-17 [P3] unverified: copy in four places reads as a claim of existing clients across NZ, Australia and internationally, which the project plan and two code comments say the site never implies; owner to decide
- F-07 [P2] open, F-08 [P3] open: carried forward, re-confirmed against this target
- F-09, F-10, F-11, F-12, F-13: closed this pass
- No P0 or P1 finding is open or fixed

### Remaining risk

- Lighthouse, axe and transfer budgets were not re-run here. The spec's verification table records them, but the repair checkpoint changed `/` and `/process` (the `StartProjectCard` cell, footer links) and updated only the test-count row, so those browser figures, and the "0 axe violations" and Lighthouse numbers published on the portfolio case study, may predate this target
- Phone-width layout of the header with the new Start a Project button was estimated from class widths (about 294 of 320 px), not observed in a browser
- The contact form was not submitted end to end; delivery through Resend needs production keys, as the spec also notes. The `?type=` preselect is covered by unit tests of `projectTypeFromQuery` and `enquiryHref`, not in a browser
- The renamed `website` honeypot carries `autocomplete="off"` and password-manager ignore hints, but whether a browser's own contact AutoFill (for example Safari's) could fill a field named `website` and silently drop a real enquiry is unverified
- TravelGrid's 357 and 739 test counts were not re-run; only suite and file counts and stack claims were checked against its repository

### Earlier review

The first independent review of this work item passed against target
c3db15633d813b12a452025039011766f77cda1d (same base and base ref, claude /
claude-opus-5-5, fresh subagent, automatic, 2026-10-05T06:39:08Z) with five
non-blocking findings, F-09 to F-13. The user chose to repair them before
merging; the repairs became checkpoint ee226e0, and the receipt above is the
fresh review of the whole delta at that checkpoint.
