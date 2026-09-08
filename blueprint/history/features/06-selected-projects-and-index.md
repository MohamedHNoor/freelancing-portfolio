# Feature: Selected projects and index

**From build-plan:** feature 6

**Branch:** feature/selected-projects-and-index

**Status:** verified

## Goal

Give the site its proof of delivery. Outcome-framed project cards on the home page
between Services and Skills, and a `/projects` route showing every project with a
filter by track and by technology.

This is also the feature that adds the first route beyond `/`, so it owns the
`aria-current` rule that `src/lib/site.ts` has been holding for it since feature 1.

Every number on a card carries the measurement it came from, and every seeded
placeholder project says on its face that it is an example. The site cannot spend
five features removing fabricated statistics and then present three fictional
client projects as real work.

## Design reference

`design/website-ui-design.png` for the card language. The two established section
layouts are Services (full-width panels with a left identity rail) and Skills (a
grid of small cards). Projects differs from both by leading with a cover image:
image on the left at `lg`, content on the right, stacked on small screens.

## In scope

- `src/lib/projects.ts`: a pure, tested module holding the card projection, the
  facet builders, and the filter predicate
- `tests/lib/projects.test.ts` covering that module
- `ProjectCard`: one component rendering a project as an outcome-framed card,
  used by both the home section and the index
- A visible `Example project` badge on any card whose project has
  `isPlaceholder: true`, plus one explanatory line on each surface that shows at
  least one placeholder
- `Projects` home section at `#projects`, inserted between Services and Skills,
  rendering `getFeaturedProjects()` and a link to `/projects`
- `/projects` route: page header with the page's only `h1`, a client-side filter
  by category and by stack entry, the filtered card list, a polite status line
  with the result count, and a reachable empty state
- Nav becomes route aware: `NAV_ITEMS` hrefs become absolute, the `Projects` item
  points at `/projects`, and a small client `NavLink` marks the active route with
  `aria-current="page"`
- A minimal `metadata` export on `/projects` (title and description only)
- Both routes stay statically generated

## Out of scope

- **`/projects/[slug]` and any link to it.** Feature 7 owns case study pages.
  Feature 6 therefore ships no case-study links at all: this project's rule since
  feature 4 is that a link that goes nowhere is worse than no link. Feature 7 adds
  the link to `ProjectCard` when the route exists.
- **`Project.links.live` and `Project.links.repo`.** Unassigned by the build plan
  and empty on every seeded project, so nothing renders and nothing can be
  verified. Assigned to feature 7 with the case study, recorded here so it is not
  silently dropped.
- Editing `src/content/projects.ts`. The seeded content is the user's to replace.
- Filter state in the URL. See Notes.
- `priority` or `placeholder="blur"` on cover images. Feature 11 measures LCP and
  decides; guessing now would preload a non-LCP image.
- Per-project OG images, canonicals, sitemap entries, or JSON-LD. Feature 10.
- The `role="list"` sweep of the hero tech row and credibility strip, the marquee
  keyboard pause, and the unverified proof point numbers. All feature 11.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is `disabled`,
so work through every step and present one review packet at the end. No commits
during implementation; `/complete` makes the single feature commit.

`qualityGates.regular` sets audit, check, and try guide to `manual` and independent
review to `when-sensitive`. This feature adds no authentication, authorization,
payment, secret, personal data, migration, or external side effect, so no gate is
selected automatically.

## Build steps

- [x] 1. **Filter and projection logic, with tests.**
  Add `src/lib/projects.ts` exporting `ProjectCardData`, `CategoryFacet`,
  `ProjectFilterState`, `toProjectCardData`, `getCategoryFacets`,
  `getStackFacets`, and `filterProjects` as specified under Data / contracts.
  Add `tests/lib/projects.test.ts` covering the cases listed under Testing.
  Nothing imports the module yet.
  **Done when:** `npm test` passes with the new file included and the existing
  63 tests still green, and `npx tsc --noEmit` is clean.

- [x] 2. **ProjectCard and the home section.**
  Add `src/components/projects/ProjectCard.tsx` and
  `src/components/sections/Projects.tsx`, and insert `<Projects />` between
  `<Services />` and `<Skills />` in `src/app/page.tsx`, replacing the comment
  that reserved the position.
  **Done when:** on the dev server, `/` shows a `#projects` section between
  Services and Skills carrying three cards, each with its cover image, the
  service name as a category badge, an `Example project` badge, an `h3` title,
  the summary, role and period, all three metrics as label, value and evidence,
  and the stack chips; one explanatory line about the example projects renders
  above the list; a `View all projects` link points at `/projects`;
  `npx tsc --noEmit` and `npm run lint` are clean; screenshots captured at 390
  and 1440.

- [x] 3. **The `/projects` route.**
  Add `src/app/projects/page.tsx` (server), plus
  `src/components/projects/ProjectIndex.tsx` and
  `src/components/projects/ProjectFilter.tsx` (both `"use client"`).
  **Done when:** `/projects` renders one `h1`, two labelled filter groups, and
  all three cards with `h2` titles; selecting `Healthcare and fintech platforms`
  leaves two cards and the status line reads `Showing 2 of 3 projects`;
  selecting `Figma to production Next.js` together with `PostgreSQL` leaves no
  cards and the empty message renders; pressing `All` in both groups restores
  three; every control is reachable by Tab with a visible focus ring and
  operable by Enter and Space; browser evidence captured for the filtered, empty,
  and restored states.

- [x] 4. **Route-aware navigation.**
  Rewrite `NAV_ITEMS` in `src/lib/site.ts` with absolute hrefs and `/projects`
  for the Projects item, add `src/components/layout/NavLink.tsx`, and use it in
  `Header.tsx` and `MobileNav.tsx`.
  **Done when:** from `/projects`, clicking `About` lands on `/` scrolled to the
  About heading, and the same holds for Services, Skills and Experience; on
  `/projects` exactly one header link and one mobile nav link carry
  `aria-current="page"`; on `/` no link carries it; the footer nav still
  navigates correctly with the new hrefs; verified in the browser.

- [x] 5. **Verification and budget.**
  **Done when:** `npx tsc --noEmit`, `npm run lint`, `npm test` and
  `npm run build` all pass; the build route table shows `/` and `/projects` both
  as `○ (Static)`; the scripted chunk-byte total is recorded for both routes and
  the change on `/` is attributed to `NavLink`; screenshots at 390, 768 and 1440
  for both routes in both themes; the browser console is clean on both routes;
  the contrast figures listed under Notes are measured and recorded.

## Files / areas

**New**

| Path | Kind |
|---|---|
| `src/lib/projects.ts` | pure logic, server and client safe |
| `tests/lib/projects.test.ts` | Vitest, node environment |
| `src/components/projects/ProjectCard.tsx` | no directive, renders in either environment |
| `src/components/projects/ProjectIndex.tsx` | `"use client"` |
| `src/components/projects/ProjectFilter.tsx` | `"use client"` |
| `src/components/sections/Projects.tsx` | server |
| `src/app/projects/page.tsx` | server, static |
| `src/components/layout/NavLink.tsx` | `"use client"` |

**Modified**

| Path | Change |
|---|---|
| `src/app/page.tsx` | insert `<Projects />` between Services and Skills |
| `src/lib/site.ts` | absolute `NAV_ITEMS` hrefs, Projects becomes `/projects` |
| `src/components/layout/Header.tsx` | render nav items through `NavLink` |
| `src/components/layout/MobileNav.tsx` | render nav items through `NavLink` |

**Read only**

`src/content/*`, `src/types/content.ts`, `src/components/ui/*`,
`src/components/primitives/*`, `src/components/layout/Footer.tsx`,
`src/app/globals.css`, `next.config.ts`.

The footer nav picks up the new hrefs automatically because it maps `NAV_ITEMS`.
It keeps plain `Link` and no `aria-current`: it is a sitemap-style list rather
than the primary navigation, and marking the same page current in three separate
nav landmarks is announcement noise.

## Data / contracts

Nothing is persisted and nothing crosses a trust boundary. The one contract that
outlives this feature is the shape passed from server to client.

```ts
export type ProjectCardData = {
  slug: string;
  title: string;
  summary: string;
  role: string;
  period: string;
  category: ServiceSlug;
  /** The matching service's `name`, resolved on the server. */
  categoryLabel: string;
  stack: readonly string[];
  isPlaceholder: boolean;
  cover: ProjectCover;
  metrics: readonly Metric[];
};

export type CategoryFacet = { slug: ServiceSlug; label: string };

/** `null` means "any" in both fields. */
export type ProjectFilterState = {
  category: ServiceSlug | null;
  stack: string | null;
};
```

- `toProjectCardData(project: Project, services: readonly Service[]): ProjectCardData`
  drops `caseStudy` and `links` on purpose, so `/projects` does not serialize
  every case study into the client payload just to draw a filter. Throws a
  `RangeError` naming the project slug and its category when no service matches.
  `assertContentInvariants` already guarantees a match for real content, so the
  throw exists for the test fixtures and for any future content edit that slips
  past the invariant.
- `getCategoryFacets(cards: readonly ProjectCardData[]): readonly CategoryFacet[]`
  returns each distinct category once, in first-appearance order. Content array
  order is the canonical order for the whole site, so this is deterministic
  without a second ordering rule.
- `getStackFacets(cards: readonly ProjectCardData[]): readonly string[]` returns
  each distinct stack entry once, sorted by plain `<` and `>` comparison on the
  raw string. **Not `localeCompare`**: `Intl` resolves its collation from the
  environment, which is the same hydration and non-reproducible-test trap that
  `src/lib/dates.ts` documents for date formatting. Code-unit ordering puts
  uppercase before lowercase; every current entry starts uppercase, and the
  comment must say so.
- `filterProjects(cards, filters)` returns the cards matching both fields, in
  input order. A `null` field matches everything. A stack filter matches when the
  card's `stack` contains that exact string. Neither the input array nor its
  elements are mutated.

Filter state lives in `useState` inside `ProjectIndex`, not in the URL.

## Testing

`tests/lib/projects.test.ts`, mirroring `src/lib/projects.ts`, node environment,
built on inline fixtures rather than on seed content that is going to be replaced.

**`toProjectCardData`**
- carries every field the card renders
- omits `caseStudy` and `links`
- resolves `categoryLabel` from the matching service's `name`
- throws a `RangeError` naming both the project slug and the category when no
  service matches

**`getCategoryFacets`**
- returns each category once for repeated categories
- keeps first-appearance order
- returns an empty list for no cards

**`getStackFacets`**
- deduplicates across projects
- sorts by code unit, not by locale (assert an exact expected array)
- preserves the exact strings with no case folding
- returns an empty list for no cards

**`filterProjects`**
- no filters returns everything in input order
- category only
- stack only
- both applied together, as AND
- a combination with no matches returns an empty array
- an unknown category returns an empty array
- an unknown stack entry returns an empty array
- does not mutate its input

Component and layout behavior is verified in the browser, per the standards.

## Notes for the AI

**Decisions taken, with the reason, so they are not relitigated mid-build.**

1. **The `Projects` nav item points at `/projects`, not `/#projects`.** Someone
   clicking a nav item labelled Projects has asked to see the work, and the index
   shows all of it with filters while the home section shows only the featured
   subset. It also gives the `aria-current` rule a real target, which feature 8
   reuses for `/resume`. Reversible in one line of `site.ts` if the user prefers
   the anchor.
2. **All other nav hrefs become absolute (`/#about` and so on).** A bare `#about`
   on `/projects` navigates to `/projects#about`, which is broken the moment a
   second route exists. `#contact` becomes `/#contact` and stays a dead anchor
   until feature 9, exactly as it is today.
3. **Filter state is component state, not a URL search param.** With three
   projects a shareable filtered URL buys little, and `useSearchParams` would add
   a Suspense boundary, an unfiltered first paint, and a duplicate-content
   question for feature 10's canonicals. Revisit if the project count grows.
4. **No separate Clear filters button.** Each group carries an `All` option, so
   clearing is always one press on a control that is always present and always
   focusable. A button that unmounts when the last filter clears would drop focus
   to `body`.
5. **Filter controls are native `<button>` with `aria-pressed`,** in two
   `role="group"` containers labelled by their visible group label. No roving
   tabindex and no new shadcn component: eight or nine plain tab stops are
   cheaper to build and to verify than a composite widget.
6. **Index cards are not wrapped in `Reveal`.** Re-animating the list on every
   filter press is noise and delays the result. The home section cards keep
   `Reveal`, matching Services and Experience.
7. **`ProjectCard` takes a `titleAs` prop of `"h2" | "h3"`.** The home section
   passes `h3` under the section's `h2`; the index passes `h2` under the page's
   `h1`. This avoids a skipped heading level on either surface without a
   screen-reader-only filler heading.

**Constraints carried in from earlier features.**

- Every list needs `role="list"`. Tailwind preflight sets `list-style: none`,
  which makes WebKit drop list semantics. This applies to the card list, the
  stack chips, and the filter option lists.
- The hero owns the only `h1` on `/`. `/projects` owns its own.
- Server components by default. The client islands added here are `NavLink`,
  `ProjectIndex`, and `ProjectFilter`, and nothing else.
- `MobileNav` takes `name` as a prop rather than importing `@/content`, to keep
  the content layer out of the browser bundle. `NavLink` must follow the same
  rule and import only `NAV_ITEMS` types it is given as props.
- Images use `next/image` with an explicit `sizes`. The card image column is
  `minmax(0,26rem)` at `lg`, so `sizes="(min-width: 1024px) 26rem, 100vw"`.
  Cover files are confirmed present at `public/projects/` and are genuinely
  1200 by 750, matching the declared `width` and `height`.
- Seeded covers carry `alt: ""` on purpose, which is correct for a decorative
  gradient panel next to a title that already names the project. Do not invent
  alt text for them.

**Contrast to measure and record in step 5**, using the established oklch to sRGB
relative-luminance method:

| Pair | Requirement | Why |
|---|---|---|
| `--input` against `--background`, both themes | 3:1 | WCAG 1.4.11, the unpressed filter button boundary |
| `--primary` against `--background`, both themes | 3:1 | the pressed filter button boundary |
| `--primary-foreground` against `--primary` | 4.5:1 | pressed filter button label |

Muted text on `--card` was measured in feature 4 at 6.57:1 light and 7.44:1 dark;
reuse those figures for the metric evidence line rather than re-measuring.

If a boundary pair falls short, fix it with a stronger border utility on the
filter buttons only and record the token figure for feature 11. Do not change
`--input` here: feature 9's form inputs read the same token and this feature
cannot verify them.

**Placeholder honesty.** The `Example project` badge and the explanatory line
must both be driven by `isPlaceholder`, never hard coded, so they disappear on
their own when the user replaces the seeded content. The explanatory line renders
only when at least one shown project is flagged.

**Measurement method for step 5.** Sum the bytes of every JS chunk referenced by
`.next/server/app/index.html` and `.next/server/app/projects.html`. The `/` figure
has been 738,939 bytes across 10 script tags for the last three features; it will
grow this time because `NavLink` puts a client island in the header, and the
report must say so rather than presenting an unchanged number.

**Evidence method.** `whileInView` reveals only fire for scroll positions the
browser actually paints. Step down the page in increments of roughly 60 percent
of `innerHeight` with a short pause between each, rather than calling
`scrollIntoView` in a synchronous loop, or elements will be captured at
`opacity: 0` and read as a defect that is not there.

## Verification record

| Check | Command or method | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | clean |
| Lint | `npm run lint` | clean |
| Tests | `npm test` | 82 passed across 4 files (63 before, 19 added) |
| Build | `npm run build` | compiled, 5 static pages |
| Route table | build output | `/` and `/projects` both `○ (Static)` |
| First-load JS, `/` | chunk-byte sum from `.next/server/app/index.html` | 754,263 bytes across 10 script tags, up 15,324 from 738,939 |
| First-load JS, `/projects` | chunk-byte sum from `projects.html` | 756,571 bytes across 10 script tags |
| Console, `/` | Playwright, full scroll | 0 errors, 0 warnings |
| Console, `/projects` | Playwright, filter exercised | 0 errors, 1 warning (LCP, see below) |
| Responsive | 390, 768, 1440, both themes, both routes | no horizontal overflow at any combination |
| Reveals | stepped scroll at 40 percent of viewport height | all 16 reach opacity 1 |
| Reduced motion | `transform: none` with `opacity: 1` on every reveal | honoured, machine has it enabled at OS level |
| Keyboard | Tab and Space through the filter | activates, keeps focus, `:focus-visible` ring present |
| Heading order | `/projects` | `h1` then three `h2`, no skipped level |
| `aria-current` | `/projects` and `/` | exactly one exposed on `/projects`, none on `/` |
| Cross-route anchors | `/projects` then About | lands on `/#about` with the heading in view |

### Contrast measured

oklch to sRGB relative luminance, same method as features 4 and 5.

| Pair | Light | Dark | Requirement |
|---|---|---|---|
| `--input` vs `--background` | 3.15:1 | 3.28:1 | 3:1, WCAG 1.4.11 |
| `--primary` vs `--background` | 6.42:1 | 3.60:1 | 3:1, WCAG 1.4.11 |
| `--primary-foreground` vs `--primary` | 6.41:1 | 5.19:1 | 4.5:1 |

All pass. `--input` passes with the least room, and feature 9's form inputs read
the same token.

### Deviations from the spec as written

1. **The cover image gained `lg:h-full lg:object-cover lg:object-top`.** The
   spec's layout was built and measured first: at 1440 it left 210px of dead
   space below the image, as much again as the image itself, because the body
   copy is roughly twice the height of a 16:10 cover. Verified at 0px after the
   change. Natural aspect ratio is kept below `lg`.
2. **`sizes` is `42rem`, not the `26rem` the spec named.** A consequence of
   deviation 1 rather than a separate decision: `object-cover` scales the source
   to the taller dimension, so a 352 by 414 box consumes about 662px of source
   width, not 416. Measured, not reasoned: at `26rem` the browser fetches 640w,
   which is fine at 1x and soft on any retina display. At `42rem` it fetches
   750w at 1x and 1920w at 2x, against a 662 and 1324 requirement.
3. **`getCategoryFacets` takes no `services` argument.** The spec's Data section
   implied one. It was unnecessary: `ProjectCardData` already carries
   `categoryLabel`, so the facets derive from the cards alone. Fewer moving
   parts, same output.

### Carried forward, with evidence

- **`/projects` first cover image is the LCP element.** Next.js reports it
  directly in the console. `priority` was deliberately out of scope for this
  feature, and the reason given was that deciding without measurement would be a
  guess. That measurement now exists, so feature 11 should add `priority` to the
  first card on the index only, not on the home page where the image is far
  below the fold. Confirm against a production build first; the dev server does
  not serve optimized images.
- **Section anchors land about 184px down rather than the 96px `scroll-mt-24`
  implies.** Reproduced on a direct load of `/#services`, not only on cross-route
  navigation, and nothing this feature added sits above `#services`, so it is
  pre-existing rather than introduced here. It is layout shift after the initial
  scroll, which is feature 11's remit.
- **`--input` is the tightest contrast pair on the site at 3.15:1.** Feature 9's
  form inputs read it, and any darkening of `--background` would push it under
  1.4.11.

### Split out of this feature

Two pieces of polish were requested while this feature was awaiting completion
and were built on this branch, then removed from it before the feature commit:
the Skills section redesign (`Skills.tsx`) and the page rhythm pass
(`Section.tsx`, `Hero.tsx`, and the padding on `/projects`). They land as a
separate `fix` so that reverting this feature would not silently revert them.
`src/app/projects/page.tsx` therefore ships here with the section padding this
feature was specced with, and the fix brings it into the new rhythm along with
the rest of the page.
