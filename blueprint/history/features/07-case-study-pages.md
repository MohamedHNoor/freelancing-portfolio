# Feature: Case study pages

**From build-plan:** feature 7

**Branch:** feature/case-study-pages

**Status:** verified

## Goal

A static page per project at `/projects/[slug]` carrying the problem, the
approach, the architecture, the stack and the outcome, with previous and next
navigation between them.

The overview calls this the headline feature: it is the whole differentiator
against a template portfolio and the main thing a client reads before enquiring.
It is also where fabricated detail would do the most damage, so the
`isPlaceholder` marker has to be at least as prominent here as it is on a card.

This feature also closes two items feature 7 was explicitly assigned in feature
6's archive: `ProjectCard` gains its case study link now that the route exists,
and `Project.links` finally renders somewhere.

## In scope

- `src/app/projects/[slug]/page.tsx`: `generateStaticParams` over every project
  slug, `dynamicParams = false`, a minimal `generateMetadata`, and a `notFound()`
  guard
- `CaseStudyHeader`: back link, category and placeholder badges, `h1`, summary,
  role, period, stack, cover image, metrics with their evidence, and the live
  and repository links when a project supplies them
- `CaseStudySection`: one case study block, rendering its heading, its body
  paragraphs and its optional bullets
- `CaseStudyNav`: previous and next, correct at both ends of the list
- `getProjectLinks` in `src/lib/projects.ts`, with tests
- `ProjectCard` gains a link to the case study, as a stretched link so the whole
  card is clickable while the accessible name stays the project title
- The placeholder note and `Example project` badge carried onto this page
- `src/app/not-found.tsx`: the styled 404 this feature's route makes reachable,
  added to the spec after the build at the user's request
- Both new routes stay statically generated

## Out of scope

- **Canonicals, Open Graph, Twitter cards, JSON-LD, sitemap entries.** Feature
  10. This feature exports `title` and `description` only, exactly as `/projects`
  did in feature 6.
- **Breadcrumb structured data.** Feature 10. The back link here is navigation,
  not markup for a search engine.
- Editing `src/content/projects.ts`.
- The unverified profile proof points, the marquee keyboard pause, and the
  `role="list"` gap in the hero and credibility strip. All feature 11.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is
`disabled`: work through every step, present one review packet, no commits.
`/complete` makes the single feature commit.

`qualityGates.regular` sets audit, check and try guide to `manual`, and
independent review to `when-sensitive`. This feature adds no authentication,
authorization, payment, secret, personal data, migration or external side
effect, and every value it renders is authored in the repository rather than
supplied by a user, so no gate is selected automatically.

## Build steps

- [x] 1. **`getProjectLinks`, with tests.**
  Add `ProjectLink` and `getProjectLinks` to `src/lib/projects.ts` per Data /
  contracts, and cover them in `tests/lib/projects.test.ts`. Nothing imports it
  yet.
  **Done when:** `npm test` passes with the new cases and the existing 82 still
  green, and `npx tsc --noEmit` is clean.

- [x] 2. **The route and its header.**
  Add `src/app/projects/[slug]/page.tsx` and
  `src/components/projects/CaseStudyHeader.tsx`.
  **Done when:** `/projects/example-health-platform` renders one `h1` carrying
  the project title, the category badge, the `Example project` badge, the
  placeholder note, the summary, role, period, stack, the cover image, and all
  three metrics with their evidence; `/projects/does-not-exist` returns the 404
  rather than an error page; `npx tsc --noEmit` narrows the project without a
  non-null assertion; browser evidence captured at 390 and 1440.

- [x] 3. **The case study body.**
  Add `src/components/projects/CaseStudySection.tsx` and render
  `project.caseStudy` from the page.
  **Done when:** the same page shows exactly four `h2` headings reading Problem,
  Approach, Architecture and Outcome in that order, every paragraph of each
  `body` renders, the three sections that carry `bullets` render them as a list
  with `role="list"`, and the Problem section, which has no bullets, renders no
  empty list.

- [x] 4. **Previous and next.**
  Add `src/components/projects/CaseStudyNav.tsx`, fed by `getAdjacentProjects`.
  **Done when:** the middle project shows both directions; the first project
  shows next only and the last shows previous only, with the remaining link
  still sitting on its own side rather than jumping across; every link is
  reachable by keyboard with a visible focus ring.

- [x] 5. **Cards link to their case study.**
  Modify `src/components/projects/ProjectCard.tsx`.
  **Done when:** clicking a card anywhere on `/` or `/projects` opens that
  project's case study; the link's accessible name is the project title alone,
  not the whole card's text; tabbing to a card shows a focus ring around the
  card rather than only around the title; the filter on `/projects` still works
  and the card still has exactly one link.

- [x] 6. **Verification and budget.**
  **Done when:** `npx tsc --noEmit`, `npm run lint`, `npm test` and
  `npm run build` all pass; the route table lists `/projects/[slug]` as `●`
  prerendered with all three slugs generated, and `/` and `/projects` are still
  `○ (Static)`; the chunk-byte total is recorded for a case study page; 390, 768
  and 1440 screenshots in both themes; the console is clean, including no
  Largest Contentful Paint warning on the cover image; the reading measure of
  the body copy is confirmed to be between 60 and 80 characters.

- [x] 7. **The 404 page.**
  Added to this spec after step 6, at the user's request. It belongs with this
  feature rather than a later one because `/projects/[slug]` is what first makes
  a 404 reachable by an ordinary visitor following a stale case study link.
  Add `src/app/not-found.tsx` as a server component. It renders inside the root
  layout, so the header, footer and skip link come with it; do not use
  `global-not-found.tsx`, which bypasses the layout and would have to restate
  `<html>`, `<body>`, the fonts and the theme script.
  **Done when:** `/projects/does-not-exist` and any other unmatched URL render
  the branded page with one `h1`, a route back to the home page, a route to
  `/projects`, and a list of the current case studies so the page is a recovery
  rather than a dead end; the response status is still 404; the list is driven
  by the content layer so replacing the seeded projects updates it; `/_not-found`
  is still `○ (Static)` in the route table; whether `not-found.tsx` metadata is
  applied is checked in the browser and recorded either way.

## Files / areas

**New**

| Path | Kind |
|---|---|
| `src/app/projects/[slug]/page.tsx` | server, static |
| `src/components/projects/CaseStudyHeader.tsx` | server |
| `src/components/projects/CaseStudySection.tsx` | server |
| `src/components/projects/CaseStudyNav.tsx` | server |
| `src/app/not-found.tsx` | server, static |

**Modified**

| Path | Change |
|---|---|
| `src/lib/projects.ts` | add `ProjectLink` and `getProjectLinks` |
| `tests/lib/projects.test.ts` | cover `getProjectLinks` |
| `src/components/projects/ProjectCard.tsx` | stretched link to the case study |

**Read only**

`src/content/*`, `src/types/content.ts`, `src/components/ui/*`,
`src/components/primitives/*`, `src/app/projects/page.tsx`, `src/lib/site.ts`.

## Data / contracts

Nothing is persisted, nothing crosses a trust boundary, and every value rendered
is authored in `src/content/`, so there is no user-controlled text on this page
and no escaping rule beyond React's default. Do not introduce
`dangerouslySetInnerHTML`.

```ts
/** Order is fixed here rather than derived from object key order, so the two
 *  buttons never swap between projects. */
export type ProjectLink = {
  key: "live" | "repo";
  href: string;
};

export function getProjectLinks(project: Project): readonly ProjectLink[];
```

- Returns only the keys the project actually supplies. `ProjectLinks` marks both
  fields optional, so absent means `undefined`, unlike `ProfileLinks` where
  absent is the empty string. Treat a whitespace-only string as absent too.
- Order is always `live` then `repo`, regardless of the order the object
  literal declares them in.
- Every seeded project has `links: {}`, so this returns an empty array for all
  three today and the header renders no link row at all. The function is tested
  against fixtures precisely because the populated states are not reachable from
  current content.

**Route contract**

- `generateStaticParams` returns `getProjectSlugs().map((slug) => ({ slug }))`.
- `export const dynamicParams = false`, so any slug not returned above is a 404
  in production. Confirmed against the Next.js 16 docs. This is incompatible
  with `cacheComponents`, which `next.config.ts` does not enable; if that ever
  changes, the `notFound()` call below becomes the only guard and must stay.
- `params` is a `Promise` and must be awaited. Type the page with the generated
  global helper `PageProps<"/projects/[slug]">`, which needs no import. If
  typegen does not accept it for `generateMetadata`, fall back to an explicit
  `{ params: Promise<{ slug: string }> }` for that function only.
- `getProjectBySlug` returns `Project | undefined`. Call `notFound()` on
  `undefined`: it returns `never`, so it narrows the type and removes any need
  for a non-null assertion. In development an unknown slug falls through to the
  page, so this branch is genuinely reachable and step 2 observes it.
- `generateMetadata` returns `title` and `description` only. Title follows the
  established shape, `` `${project.title} - ${getProfile().name}` ``.

## Testing

`tests/lib/projects.test.ts`, extending the existing file with a
`getProjectLinks` block built on the fixtures already defined there.

- both links supplied returns both, `live` first
- only `live` supplied
- only `repo` supplied
- neither supplied returns an empty array
- declaration order in the object literal does not change the output order
- an empty or whitespace-only string is treated as absent, not as a link to
  nowhere

Page structure, heading order, adjacency rendering and the card link are
verified in the browser, per the standards.

## Notes for the AI

**Decisions taken, with the reason.**

1. **The cover image on this page gets `priority`.** Feature 6 deferred this to
   feature 11 because deciding without measurement would have been a guess. The
   measurement now exists: Next.js reported the first cover image as the Largest
   Contentful Paint element on `/projects`, where it sits well below the fold.
   On a case study it sits near the top, so it is the LCP element with more
   certainty, not less. Step 6 confirms by the absence of the warning. Feature 11
   should apply the same treatment to `/projects` once it measures.
2. **`ProjectCard` uses a stretched link, not a wrapped card.** The title is the
   link, with `after:absolute after:inset-0` over the card and `relative` on the
   card, so the accessible name is the title alone rather than the card's entire
   text. Wrapping the whole card in an anchor would produce a link announced as
   several hundred characters. Give the card
   `has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring` so keyboard
   focus is visible around the card and not only around the title.
   No other interactive element sits inside the card, so nothing is trapped
   underneath the overlay. The known cost is that text selection across the card
   is largely lost, which is the accepted trade for a card whose purpose is to
   be opened.
3. **Case study sections use a heading rail at `lg`.** The four headings sit in a
   left rail beside their prose, so a reader can scan the four stages and jump.
   This reuses the Services and Experience idiom deliberately: this is a
   different page from the one-pager, so the repetition reads as a house style
   rather than as monotony.
4. **Body copy is capped at a reading measure**, not run to the container width.
   Step 6 checks it lands between 60 and 80 characters.
5. **No `Section` primitive on this page.** `Section` renders an `h2` and is
   built for the one-pager. A case study owns its own `h1`, so it uses a page
   header like `/projects/page.tsx` does.

**Constraints carried in from earlier features.**

- Page padding must match the rhythm set by the recent fix:
  `py-12 sm:py-14 lg:py-16`. There are now four places that set it, listed in the
  comment in `Section.tsx`.
- Every list needs `role="list"`, because Tailwind preflight sets
  `list-style: none` and WebKit then drops list semantics.
- Server components by default. This feature adds no client island at all.
- One `h1` per page. Case study sections are `h2`.
- `next/image` needs an explicit `sizes`. Do not copy the `42rem` value from
  `ProjectCard`: that number compensates for `object-cover` cropping in a narrow
  column, and this page displays the cover at a different size. Work it out for
  the layout actually built, and record the number.
- Seeded covers carry `alt: ""` on purpose. Do not invent alt text.

**The honesty contract.** All three projects are `isPlaceholder: true`, and this
page is where a fictional case study is read in the most depth. The
`Example project` badge and the explanatory line must both appear here, above
the case study body, and both must be driven by the flag so they disappear on
their own when real work replaces the seed. Reuse the wording already used on the
home section and the index so the three surfaces agree.

**Known gap to record, not to fix here.** `generateMetadata` uses
`project.summary` as the description, and the seeded summaries run to about 180
to 200 characters, which is longer than a search engine will show. Feature 10
owns descriptions and should decide whether to truncate or to add a dedicated
field to `Project`.

**Evidence method.** `whileInView` reveals only fire for scroll positions the
browser actually paints. Step down the page in increments of roughly 40 percent
of `innerHeight` with a pause between each, rather than calling `scrollIntoView`
in a synchronous loop, or elements will be captured at `opacity: 0` and read as
a defect that is not there.


## Verification record

| Check | Command or method | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | clean |
| Lint | `npm run lint` | clean |
| Tests | `npm test` | 88 passed across 4 files, 6 added |
| Build | `npm run build` | clean |
| Route table | build output | `/projects/[slug]` prerendered `●` for all three slugs; `/` and `/projects` still `○ (Static)` |
| First-load JS, `/` | chunk-byte sum | 754,375 bytes, up 112 from 754,263 |
| First-load JS, `/projects` | chunk-byte sum | 757,022 bytes, up 451 |
| First-load JS, a case study | chunk-byte sum | 745,302 bytes, lighter than either, because the page carries no client island |
| Console, case study | Playwright | 0 errors, 0 warnings, including no LCP warning |
| Console, `/projects` | Playwright | 0 errors, 1 warning, the pre-existing LCP notice feature 11 owns |
| Heading order | `/projects/example-health-platform` | one `h1`, then exactly four `h2` reading Problem, Approach, Architecture, Outcome |
| Bullets | same page | present on Approach and Architecture, absent on Problem and Outcome, no empty list rendered |
| Reading measure | chars per rendered line | median 67, range 61 to 80 |
| Unknown slug | `/projects/does-not-exist` | 404 |
| Adjacency | all three case studies | first shows next only in column 2, middle shows both, last shows previous only in column 1 |
| Card link | hit test at cover, metrics and stack | all three resolve to the single case study anchor |
| Card link name | accessibility check | the project title alone, one anchor per card |
| Card focus ring | real keyboard Tab | card ring goes from 1px at 10 percent to 2px in the ring colour |
| Responsive | 390, 768, 1440, both themes | no horizontal overflow |
| Cover image | rendered box | 1088 by 448 at desktop, 358 by 225 at 390, source 1200w chosen |
| `priority` | built HTML | `rel="preload" as="image"` present in the prerendered page |
| 404 status | `/projects/does-not-exist`, `/totally-made-up` | both 404, a real case study still 200 |
| 404 page | Playwright | one `h1`, an `h2` for the case study list, both CTAs, all three case study links, header, footer and skip link inherited from the root layout |
| 404 metadata | rendered title | `not-found.tsx` metadata **is** applied in Next 16: the title reads `Page not found - Mohamed Noor` |
| 404 route | build output | `/_not-found` still `○ (Static)` |
| 404 responsive | 390, both themes | no horizontal overflow |

### Deviations from the spec as written

1. **The cover image is capped at `max-h-112` with `object-cover object-top`.**
   The spec did not mention a cap. Built and measured first: at the full content
   width a 16:10 cover renders 1088 by 681, three quarters of a laptop viewport,
   pushing the outcome numbers and the Problem section below the fold on the one
   page a client came to read. The cap does not change the `sizes` value, since
   the box is still wider than the crop is tall.
2. **`Measured` is a `p`, not an `h2`.** Writing it as a heading would have put
   a fifth entry in the document outline and broken step 3's own done-when of
   exactly four `h2` elements. It labels the list through `aria-labelledby`
   instead, which is what `ProjectCard` already does.
3. **The spec gained a seventh step after step 6 had passed.** `not-found.tsx`
   was written into Out of scope with the instruction not to build it here, and
   the user asked for it. Rather than improvise past the spec, the spec was
   amended: the page moved into In scope, step 7 was added with its own
   done-when, and the file was added to the files table. It belongs with this
   feature because `/projects/[slug]` is what first makes a 404 reachable by an
   ordinary visitor following a stale link.

### Carried forward

- **`/projects` still reports its first cover image as the LCP element.**
  Unchanged by this feature and still feature 11's to fix, now with a working
  example on the case study page to copy.
- **`generateMetadata` uses `project.summary` as the description**, which runs
  180 to 200 characters in the seed content, longer than a search engine shows.
  Feature 10 owns descriptions.
- **`getProjectLinks` has no reachable UI state.** Every seeded project has
  `links: {}`, so the live and repository buttons render for nobody today. The
  logic is covered by fixtures, and the empty case is asserted directly against
  the real content, but the populated layout has never been seen in a browser.

### Split out of this feature

Two defects reported during review were fixed on this branch and then removed
from it before the feature commit, because neither belongs to case study pages:

- `src/app/page.tsx` returned a fragment of seven sections, so Next had seven
  candidates for its client-navigation scroll target and settled on the
  credibility strip, scrolling past the hero. A defect in feature 3's markup,
  made reachable by feature 6's routes.
- `src/components/sections/Hero.tsx` did not fill the viewport.

They land as a separate `fix` immediately after this feature. One consequence is
recorded honestly: between the two commits, the 404 page's `Back to home` button
inherits the scroll defect, exactly as the header logo already did.
