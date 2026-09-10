# Feature: Real projects replace the placeholders

**From build-plan:** feature 14

**Branch:** feature/real-projects-replace-the-placeholders

**Status:** verified

## Goal

Put real work on the site, one project per service track, and delete the three
fictional ones.

Every project shipping today is seeded: three invented case studies about
companies that do not exist, each carrying `isPlaceholder: true`. Feature 13 made
that mechanical - a production build is refused while any of them remain - so the
site cannot deploy until this feature lands. It is also the last thing standing
between the site and its own premise, which is replacing social proof with
demonstrable work.

Two projects, chosen so both tracks the site sells have evidence behind them:

- **TravelGrid Africa** for the platform track. A wallet-first travel commerce
  platform with an append-only ledger, atomic booking debits, and tenant
  isolation enforced in Postgres as well as the app layer. This is exactly what
  the overview says fintech and healthcare buyers evaluate on.
- **This site** for the Figma to Next.js track. Without it that track has no
  evidence at all, and the project plan already frames the site as a work sample
  in its own right.

## In scope

- A screenshot per project, sized and weighted to the existing cover contract
- Two `Project` entries with full case studies, outcome-framed metrics, and
  evidence that survives a buyer checking it
- Deleting all three seeded projects and their cover PNGs
- Updating the two existing tests that assert the current all-placeholder state
- Correcting the sitemap count in the README smoke list, which changes with the
  project count

## Out of scope

- The writing section and testimonial quotes. Still unscheduled candidates in
  `build-plan.md`, not part of this item.
- Replacing the seeded roles in `experience.ts` or the placeholder usage context
  on the thirty skills. Real, still outstanding, and deliberately not bundled
  here: the deploy gate covers projects only, and mixing content rewrites would
  make this diff unreviewable. They stay recorded in the overview's open
  questions.
- Supplying the CV file. `profile.links.cv` is empty and the resume download
  correctly renders nothing.
- Any change to the `Project` type, the case study route, or the social images.

  Card and index layout **were** out of scope and became in scope during
  implementation, at the user's explicit request, after real screenshots showed
  the existing card could not display them. Recorded as step 4 rather than done
  quietly: the original rule was that a component needing changes to show real
  content is a finding to raise, and this is that finding, raised and then
  authorised.
- The deploy itself. This feature unblocks it; it does not perform it.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is
`disabled`. Implement the steps in order without stopping for approval between
them and without committing along the way, then present one review packet.
`/complete` creates the single feature commit and merges after approval.

**Two servers are needed, at different times, and neither may be started by the
AI.** Step 1 needs the TravelGrid client (`cd ~/projects/node-js/travel_grid_api/client
&& npm run dev`). Step 2 needs this site's own production server
(`npm run build && npm start`). Ask for each at the start of its step and confirm
it is up before driving the browser.

`npm test` and `npm run build` must be green before the review packet, and
`npm run preflight` must exit **0** by the end - the first time in this project's
history.

## Build steps

- [x] 1. **TravelGrid Africa: screenshot, then the entry.** Ask the user to start
  the TravelGrid client, then capture a 1200x750 PNG to
  `public/projects/travelgrid-africa.png` via Playwright MCP. Pick a screen that
  shows the product doing something, not an empty shell; if the app needs Postgres
  and env for anything past the landing page, say so and take the best screen that
  renders, rather than faking one. Keep the file under the 80 KB source ceiling in
  `AGENTS.md`; if the capture is heavier, reduce it and record the final size.

  Then add the entry to `src/content/projects.ts` with `slug:
  "travelgrid-africa"`, `category: "saas-platforms"`, `featured: true`, and
  `isPlaceholder: false`. `cover.alt` must be a real description of what the
  screenshot shows - the existing empty `alt` values are documented as being empty
  only because a gradient panel conveys nothing, and that exemption does not
  extend to a real screenshot.

  Metrics come from the repository, each with evidence naming where the number was
  read. Verified while speccing: **234 test cases across 27 server suites**, 15
  route modules, and `rlsIsolation.test.ts`, which connects as a dedicated
  non-superuser role to prove a forgotten filter still cannot return another
  tenant's rows. The financial suites prove webhook replay cannot double-credit,
  that two concurrent bookings against one unit of inventory yield exactly one
  booking, and that an insufficient balance rolls the inventory decrement back.
  Do not invent uptime, latency, or user numbers.

  The four case study headings are fixed: Problem, Approach, Architecture,
  Outcome, in that order. **The case study must state plainly that this is
  self-initiated work rather than a client engagement**, unless the user says
  otherwise - `src/content/projects.ts` requires exactly that, and implying a
  client that does not exist is the failure this site was built to avoid.
  **Done when** `npm test` and `npm run build` are green, `/projects` and
  `/projects/travelgrid-africa` render with the real cover, and the case study
  states how the work came about.

- [x] 2. **This site: screenshot, then the entry.** Ask the user to start this
  site's production server, then capture `public/projects/portfolio-site.png` at
  1200x750 in the dark theme, which is the default and the site's primary
  identity. Same weight ceiling and same alt-text rule.

  Add the entry with `slug: "portfolio-site"`, `category: "figma-to-nextjs"`,
  `featured: true`, `isPlaceholder: false`. Its metrics are already measured and
  recorded in `AGENTS.md`: Lighthouse accessibility **100/100** on three routes
  with the mobile preset, **zero axe violations** on every route in both themes
  including the open menu and a form showing its errors, and a real-browser LCP of
  **108 ms**. The Outcome section must also state the performance result honestly:
  92 to 97 on the mobile preset, below the 95 target on two routes, with the
  reason recorded in `AGENTS.md`. A case study that reports only the good numbers
  on a site whose entire pitch is honest measurement would undercut the pitch.
  **Done when** `npm test` and `npm run build` are green, the route renders, and
  the Outcome section names both the accessibility result and the performance
  shortfall.

- [x] 3. **Delete the placeholders and let the gate pass.** Remove all three
  seeded entries from `src/content/projects.ts` and their three PNGs from
  `public/projects/`. Then repair the two tests that assert today's
  all-placeholder state, which will fail and should:
  - `tests/content/index.test.ts:255` asserts every shipped project is a
    placeholder. Invert it: the shipped content must now have none.
  - `tests/lib/deploy-readiness.test.ts` has a case asserting the shipped content
    produces one blocker. Invert it to assert the shipped content is deployable.
    Keep every fixture-based case in that file exactly as it is; those prove the
    rule still works and must not be weakened just because the real content now
    passes.

  Update the README smoke list, which says `/sitemap.xml` lists eleven URLs. With
  two projects it is ten. **Done when** `npm test` and `npm run build` are green,
  `npm run preflight` **exits 0**, the served `/sitemap.xml` carries ten URLs, no
  page anywhere shows an "Example project" marker, and `/projects` renders two
  real projects with working previous and next navigation between the two case
  studies.

- [x] 4. **Card and index layout, added at the user's request.** The seeded
  covers were gradient panels, so the card had been built to crop them: the
  cover sat in a 26rem column at `lg`, stretched to the text column's height
  with `object-cover object-top`. Real screenshots made that wrong in three
  compounding ways, each found by looking at the rendered page rather than
  reasoning about it:

  - **Cropped.** The bottom of every screenshot was cut off. Removed
    `object-cover`, and did the same on `CaseStudyHeader`, which capped height
    the same way.
  - **Too small, and surrounded by dead space.** Measured at 352x221 with
    230-269px of empty card beneath it. Side by side cannot converge: matching a
    490px text column needs a cover about 770px wide, which squeezes the copy
    and makes it taller again. The cover moved above the copy, and the cards
    went two up from `lg`, so the section fell from about 2060px to 620px.
  - **Framed inside its own padding.** A bordered image inside a bordered card,
    ringed by dead space. `Card` already handles full-bleed media through
    `has-[>img:first-child]:pt-0` and `*:[img:first-child]:rounded-t-xl`, but
    only for a direct first child; the cover was two levels down. Moving it out
    took the cover to 528px with no surrounding gap.

  Then the card was still 1020px tall with the cover only a third of it, because
  the body carried three metric evidence paragraphs, role, period and eight
  stack chips. All of that is already on the case study, so the card was trimmed
  to cover, track, title, summary and three numbers: 727px. One metric value was
  shortened from "Enforced in Postgres" to "Postgres RLS", which had wrapped to
  two lines and broken the metric row's alignment.

  **Done when** `npm test`, `npm run build` and `npm run preflight` are green,
  and axe reports zero violations on `/`, `/projects` and a case study in both
  themes, since list semantics changed and a labelled region was removed.

- [x] 5. **Every remaining content file made real, added at the user's request.**
  Out of scope as written, and taken on mid-implementation because the seeded
  content that survived feature 14 became the site's largest remaining risk: the
  deploy gate covers projects only, so an invented work history had nothing
  stopping it.

  - **`experience.ts`** - two invented employers deleted. Replaced with
    `Independent · Freelance software engineer · 2023-08 → present` and
    `Microverse · Remote Full-stack Web Development Program · 2022-08 → 2023-07`,
    both supplied by the user. An earlier draft had the freelance start at
    2022-08, which overlapped the program; corrected to the month it ended.
  - **`profile.ts`** - location Wellington, New Zealand rather than "Remote";
    `longBio` rewritten around confirmed facts. Deleted a promise nobody had
    made: "a shared board, a staging URL from day one, and a short written
    update at the end of each week".
  - **`skills.ts`** - all 33 contexts name where the technology was actually
    used, sourced from the two real projects or public repositories. Figma,
    Stripe and Redux added. Five icon keys were wrong and silently rendered
    nothing; `getTechnologyMarks` filters on `icon !== undefined` rather than
    registry membership, so those would have reached the hero row as iconless
    chips. All 24 keys now verify against `TechIcon`.
  - **`services.ts`** - the developer's own wording, a handover step on both
    tracks, and a header separating deliverables (must be backed by real work)
    from process and timelines (promises about future engagements).
  - **Job title** changed to software engineer in all six places it appeared,
    not just the one the user named.
  - **Hero and footer** were rendering the same string. The footer now has its
    own `Profile.closing` field, and the headline was rewritten three times to
    land on "Pixel-exact sites. Auditable platforms.": both niches, 39
    characters, one line per buyer.
  - **Conversion copy** on the home contact section and `/contact`, ordered ask,
    then risk reversal, then scarcity. The one business day reply is a
    commitment, recorded as such in source.
  - **Footer layout** rebuilt: it carried no address, no profiles and nothing to
    act on, and two successive attempts left a void in the middle. Proportional
    columns, navigation two across, 406px to 310px.
  - **`project-plan.md` §1** corrected: the premise claimed no completed jobs,
    which five delivered projects makes false. The overview still repeats the
    old sentence and needs `/overview` to regenerate.

  **Done when** no content file declares itself placeholder, `npm test`,
  `npm run build` and `npm run preflight` are green, and axe reports zero
  violations across four routes in both themes.

## Files / areas

**New**

- `public/projects/travelgrid-africa.png`, `public/projects/portfolio-site.png`

**Changed**

- `src/content/experience.ts`, `profile.ts`, `skills.ts`, `services.ts` - real content
- `src/types/content.ts` - `Profile.closing`
- `src/components/layout/Footer.tsx` - rebuilt layout, contact links
- `src/components/sections/Contact.tsx`, `src/app/contact/page.tsx` - conversion copy
- `src/components/icons/TechIcon.tsx` - figma, redux, stripe marks
- `src/app/layout.tsx`, `opengraph-image.tsx`, `resume/page.tsx`, `src/lib/site.ts` - job title
- `blueprint/project-plan.md` - corrected premise
- `src/components/projects/ProjectCard.tsx` - full-bleed cover, trimmed body
- `src/components/projects/CaseStudyHeader.tsx` - uncropped cover
- `src/components/projects/ProjectIndex.tsx`, `src/components/sections/Projects.tsx` - two-up grid
- `src/content/projects.ts` - three entries out, two in
- `tests/content/index.test.ts`, `tests/lib/deploy-readiness.test.ts` - the two
  assertions about shipped content
- `README.md` - the sitemap count in the smoke list

**Deleted**

- `public/projects/example-studio-marketing-site.png`,
  `example-health-platform.png`, `example-finance-dashboard.png`

**Untouched**

`src/types/content.ts`, every component, every route, and the deploy-readiness
rule itself. The `isPlaceholder` field and all the code keyed on it stay: the
guard has to keep working for the next project added.

## Data / contracts

**`Project`** is a locked shape. Both entries must supply `slug`, `title`,
`summary`, `role`, `period`, `category`, `stack`, `featured`, `isPlaceholder`,
`links`, `metrics`, `cover`, `caseStudy`.

- `slug` - lowercase kebab-case, unique. `assertContentInvariants` throws
  otherwise.
- `category` - must equal an existing `Service` slug: `figma-to-nextjs` or
  `saas-platforms`. One project each, which is the point of the pairing.
- `caseStudy` - exactly Problem, Approach, Architecture, Outcome, in that order.
  The invariant check throws on any other set or order.
- `metrics[].evidence` - must be non-empty; the invariant check throws on blank.
  The stricter rule this feature applies: evidence names a measurement that was
  actually taken, in a place a reader could go and check.
- `cover` - `{ src, alt, width, height }` at 1200x750, source PNG under 80 KB per
  the `AGENTS.md` budget. `alt` describes the screenshot.
- `links` - `{ live?, repo? }`. Absent or blank entries are dropped by
  `getProjectLinks`, so omitting them renders no button rather than a dead one.

**Array order is canonical** for the whole site: the home section, the index, the
sitemap, and previous/next navigation all read it. Put the stronger project
first, and record which and why in the review packet.

**Sitemap count** moves from eleven URLs to ten: eight static routes plus one per
project.

## Testing

The test gate is on, but this feature adds no logic - it is content and two
assets. The two test changes in step 3 are corrections to assertions about
shipped content, not new coverage.

The real check is `assertContentInvariants`, which runs at module scope and fails
the build on a malformed entry, plus `npm run preflight` reaching exit 0.

Browser evidence comes from the screenshots and from loading both case study
routes. No `Browser tests` command exists and this feature does not add one.

## Notes for the AI

- Everything written in these two case studies is a public claim about real work.
  Draft from the repositories, and flag anything you inferred rather than read, so
  the user can correct it before it ships. When in doubt, leave it out.
- The site has two projects after this, not three. `/projects` will look sparse
  and that is the correct trade: two true case studies beat five with three
  fictions.
- Do not soften the deploy-readiness fixtures in step 3. The temptation is to
  make the whole file agree that everything is fine now; the fixture cases are
  what prove the gate still catches a placeholder next time.
- Check `src/app/resume/page.tsx`, which reads `isPlaceholder` for featured
  projects. Confirm it still renders correctly with none set, rather than
  assuming.
- Both new covers are real screenshots, so both need descriptive `alt`. The
  existing empty `alt` values are documented as an exemption for content-free
  gradient panels and do not carry over.

## Open questions

None blocks starting: steps 1 and 2 can proceed on defaults and the answers can
be dropped in before the packet.

- **Is TravelGrid self-initiated or client work, and what was the role?** The
  README names no client, and this spec assumes self-initiated with the case study
  saying so. If there was a real engagement, say so and the framing changes.
  `role` is currently unset for the same reason.
- **Is there a public URL or repository to link?** The README says it currently
  runs on Railway but names no address, and does not say whether the GitHub
  repository is public. Both `links` fields stay empty otherwise, which renders no
  buttons. A live link materially strengthens a case study, so it is worth
  supplying if one exists.
- **The period.** Git history runs 2026-07 to 2026-08 across 130 commits, so the
  spec assumes `"2026"`. Correct it if the work started earlier than the
  repository did.
- **The slug for this site.** `portfolio-site` gives `/projects/portfolio-site`.
  Cheap to change now, not after the URL is in a sitemap someone has crawled.
