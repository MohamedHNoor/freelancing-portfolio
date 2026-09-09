# Feature: Section detail pages

**From build-plan:** feature 9

**Branch:** feature/section-detail-pages

**Status:** verified

## Goal

Give about, services, skills and experience the shape projects already has: a
scannable summary on the home page that links to a route carrying the full
content, with primary navigation pointing at the routes.

The reduction is the load-bearing half. Today each of those four sections
renders **everything** it has, so adding a route without cutting the section
would produce four pages that are byte-for-byte duplicates of content already on
`/`, with nothing gained and a canonical-URL problem handed to feature 11. The
home page also runs to roughly 8,300px, which is a lot of scroll to ask of a
visitor who arrived from a proposal link.

## In scope

- Four static routes: `/about`, `/services`, `/skills`, `/experience`, each with
  its own `h1` and minimal `metadata`
- Four full-content components under `src/components/detail/`, holding the
  markup moved out of the current sections
- The four home sections rewritten as summaries, each ending in a link to its
  page
- `PageHeader` primitive: eyebrow, `h1`, lead. Used by the four new routes and
  adopted by `/projects`, which currently hand-rolls the same markup
- `NAV_ITEMS` switched from home anchors to routes for about, services, skills
  and experience
- All four routes statically generated

## What moves where

| Section | Home page keeps | Its route adds |
|---|---|---|
| About | first `longBio` paragraph, availability | the remaining paragraphs, location, supplied profile links |
| Services | per track: name, `forWho`, summary, `typicalTimeline` | `deliverables` and the `process` steps |
| Skills | group label and technology names as chips | the usage context for every skill, in the current ruled index |
| Experience | company, title, dates, one-line summary | `impact` bullets and the per-role stack |

## Out of scope

- **The Contact nav item.** It stays `/#contact`. Feature 10 decides whether
  contact is a page, a home section, or both, and that is already recorded as
  the first open question in the overview. Note that after this feature it is
  the only anchor left in the navigation, and it still scrolls nowhere, exactly
  as it has since feature 1.
- **The hero's `See case studies` button**, which points at `#projects`. It is a
  scroll-down call to action on the page it lives on, which is a different
  intent from a navigation item, and Hero renders only on `/`.
- **`/resume` adopting `PageHeader`.** Its header is a different shape: the name
  is the `h1` and there is no eyebrow or lead.
- Canonicals, sitemap entries, structured data, social images. Feature 11.
- Editing anything in `src/content/`.
- Adding `isPlaceholder` to `Role`, still recommended and still the user's call.

## Build loop

`workflow.stepReview` is `feature`, `workflow.checkpointCommits` is `disabled`:
work through every step, present one review packet, no commits. `/complete`
makes the single feature commit.

`qualityGates.regular` sets audit, check and try guide to `manual`, independent
review to `when-sensitive`. This feature adds no authentication, authorization,
payment, secret, personal data, migration or external side effect, and renders
only content authored in the repository, so no gate is selected automatically.

This is the largest feature since the content layer: nine new files and six
modified. Each step below adds one route together with the inbound link that
makes it reachable, so the project is complete and navigable after every step
rather than only at the end. If the diff reads as too much at review, the
natural split is steps 2 and 3 as one feature and steps 4 to 6 as another.

## Build steps

- [x] 1. **`PageHeader`, and `/projects` adopting it.**
  Add `src/components/primitives/PageHeader.tsx` taking `eyebrow`, `heading`,
  `lead` and an `id` for the `aria-labelledby` pairing, and use it in
  `src/app/projects/page.tsx` in place of the inline markup.
  **Done when:** `/projects` renders exactly as before, confirmed by comparing
  the rendered heading block against the current page; `npx tsc --noEmit` and
  `npm run lint` clean.

- [x] 2. **About.**
  Add `src/components/detail/AboutDetail.tsx` carrying the full narrative,
  location and any supplied profile links; add `src/app/about/page.tsx`; reduce
  `src/components/sections/About.tsx` to the first paragraph plus availability
  with a link to `/about`.
  **Done when:** `/about` returns 200 with one `h1` and every `longBio`
  paragraph; the home About section shows one paragraph and a working link to
  `/about`; browser evidence at 390 and 1440.

- [x] 3. **Services.**
  Add `src/components/detail/ServicesDetail.tsx`, `src/app/services/page.tsx`,
  and reduce the section per the table above.
  **Done when:** `/services` shows both tracks with deliverables and every
  process step; the home section shows neither, keeps name, `forWho`, summary
  and timeline, and links to `/services`; the home Services section is
  measurably shorter than before, with the before and after heights recorded.

- [x] 4. **Skills.**
  Add `src/components/detail/SkillsIndex.tsx` holding the ruled index moved out
  of the section, `src/app/skills/page.tsx`, and reduce the section to grouped
  chips.
  **Done when:** `/skills` shows all thirty entries with their usage context in
  the existing ruled layout; the home section shows the same thirty names as
  chips with no context and links to `/skills`; no horizontal overflow at 390.

- [x] 5. **Experience.**
  Add `src/components/detail/ExperienceTimeline.tsx`, `src/app/experience/page.tsx`,
  and reduce the section.
  **Done when:** `/experience` shows every role with impact bullets and stack;
  the home section shows company, title, dates and the one-line summary only,
  and links to `/experience`; dates still render as `<time>` elements on both
  surfaces, and `Present` still renders as plain text for the ongoing role.

- [x] 6. **Navigation and verification.**
  Point the About, Services, Skills and Experience items in `src/lib/site.ts` at
  their routes.
  **Done when:** every navigation item except Contact is a route; each marks
  `aria-current="page"` on its own page and nowhere else, verified on at least
  three of them; `npx tsc --noEmit`, `npm run lint`, `npm test` and
  `npm run build` all pass with the existing 102 tests green; the route table
  lists all four new routes as `○ (Static)`; chunk-byte totals recorded for `/`
  and one new route; the home page's total height before and after is recorded;
  390, 768 and 1440 in both themes with no horizontal overflow; console clean.

## Files / areas

**New**

| Path | Kind |
|---|---|
| `src/components/primitives/PageHeader.tsx` | server |
| `src/components/detail/AboutDetail.tsx` | server |
| `src/components/detail/ServicesDetail.tsx` | server |
| `src/components/detail/SkillsIndex.tsx` | server |
| `src/components/detail/ExperienceTimeline.tsx` | server |
| `src/app/about/page.tsx` | server, static |
| `src/app/services/page.tsx` | server, static |
| `src/app/skills/page.tsx` | server, static |
| `src/app/experience/page.tsx` | server, static |

**Modified**

| Path | Change |
|---|---|
| `src/components/sections/About.tsx` | reduced to a summary plus a link |
| `src/components/sections/Services.tsx` | reduced to a summary plus a link |
| `src/components/sections/Skills.tsx` | reduced to chips plus a link |
| `src/components/sections/Experience.tsx` | reduced to a summary plus a link |
| `src/lib/site.ts` | four anchors become routes |
| `src/app/projects/page.tsx` | adopts `PageHeader` |

**Read only**

`src/content/*`, `src/types/content.ts`, `src/lib/dates.ts`,
`src/components/ui/*`, `src/components/layout/*`.

## Data / contracts

No new data, no new types, no persistence, and nothing crosses a trust boundary.
Every value rendered is authored in `src/content/` and read through the existing
helpers, so there is no user-controlled text and no escaping rule beyond React's
default.

The one shared shape this feature introduces is presentational:

```ts
type PageHeaderProps = {
  /** Pairs with `aria-labelledby` on the page's landmark. */
  id: string;
  eyebrow: string;
  heading: string;
  lead?: string;
};
```

**Route contract.** All four are plain static routes with no dynamic segment, so
there is no `generateStaticParams`, no `dynamicParams`, and no `notFound()`
path. Each exports `metadata` with `title` and `description` only, following the
shape the other routes use: `` `<Page> - ${getProfile().name}` ``.

**Empty content.** Each section already returns `null` when its content is
empty, and that behaviour is preserved on the home page. The routes differ: a
page always renders its `PageHeader`, because a route that exists must not
render a blank document, and the body carries the same conditional as the
section. Not reachable with current content, but specified so it is not
reinterpreted later.

## Testing

**No new tests, and that is not an omission.** This feature adds no parser,
formatter, validator, id builder or server action; it moves existing markup and
composes existing content helpers. The test gate applies to logic, and there is
none here. The existing 102 tests must stay green, which step 6 checks.

Structure, navigation and layout are verified in the browser, per the standards.

## Notes for the AI

**Decisions taken.**

1. **The full-content components hold moved markup, not rewritten markup.** Take
   the existing bodies out of the four sections as they are, then write the
   leaner summaries. Rewriting the detail layouts from scratch would throw away
   work that was already measured and corrected: the Skills ruled index in
   particular went through three designs and its two-column measure is the
   result of measuring characters per line.
2. **`Reveal` stays on the home summaries and does not go on the pages.** Reveal
   server-renders `opacity: 0`, which its own docstring calls a fine trade for
   decoration below the fold and a bad one for anything load-bearing. On a detail
   page the content is the entire reason the page exists, exactly as with case
   studies in feature 7.
3. **The home sections keep their `id` attributes.** Nothing in the navigation
   points at them afterwards, but the hero's own call to action uses `#projects`
   and an id costs nothing. Do not remove them.
4. **`PageHeader` is used by five routes, not six.** `/resume` keeps its own
   header because the name is its `h1` and it has no eyebrow or lead.

**Constraints carried in from earlier features.**

- Every list needs `role="list"`. Tailwind preflight sets `list-style: none` and
  WebKit then drops list semantics.
- One `h1` per page. Home sections stay `h2` through the `Section` primitive;
  each new route owns its own `h1` through `PageHeader`.
- Page padding follows the shared rhythm, `py-12 sm:py-14 lg:py-16`, and the
  container stays `max-w-6xl`. `Section` already applies both; the new routes
  must match it rather than inventing their own.
- Server components by default. This feature adds no client island.
- Dates come from `src/lib/dates.ts` on both surfaces. Do not add a second
  format, and keep the `<time>` elements: `PRESENT` is not a valid `datetime`,
  which is why the ongoing role renders plain text.
- `NavLink` marks a route item current and treats anything containing `#` as an
  anchor it will never mark. Four more items become markable in step 6.

**What this changes about the home page, stated plainly.** It gets shorter and
less complete. That is the intent, and it is worth checking against the product
goal at review: the plan calls `/` a conversion page where every section has to
earn the next scroll, so a summary that does not earn the click is worse than
the full section it replaced. Record the before and after heights and read the
result as a visitor, not as a diff.

**Evidence method.** `whileInView` reveals only fire for scroll positions the
browser actually paints. Step down the page in increments of roughly 40 percent
of `innerHeight` with a pause between each, rather than calling `scrollIntoView`
in a synchronous loop, or elements will be captured at `opacity: 0` and read as
a defect that is not there.


## Verification record

| Check | Command or method | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | PASS |
| Lint | `npm run lint` | PASS |
| Tests | `npm test` | PASS, 102 across 5 files, unchanged as expected |
| Build | `npm run build` | PASS |
| Route table | build output | `/about`, `/services`, `/skills`, `/experience` all `○ (Static)` |
| `aria-current` | six routes plus `/` | each of about, services, skills, experience, projects and resume marks its own item and only its own; `/` marks none |
| Responsive | 390, 768, 1440 across five routes in both themes | no overflow in any of the thirty combinations |
| Console | Playwright listener across all routes | no errors, no warnings |
| Reveals | stepped scroll at 40 percent of viewport height | zero elements left below opacity 1 |
| First-load JS, `/` | chunk-byte sum | 754,403 bytes, effectively unchanged |
| First-load JS, the four new routes | chunk-byte sum | 730,540 bytes each across 10 tags, the lightest routes on the site |

### The home page, before and after

| Section | Before | After |
|---|---|---|
| About | 644 | 410 |
| Services | 1,822 | 752 |
| Skills | 1,732 | 873 |
| Experience | 1,325 | 741 |
| **Whole page** | **about 8,300** | **6,128** |

Projects is unchanged at 1,952, because feature 6 already gave it this shape.

Read as a visitor rather than as a diff, the Skills summary is the clearest win:
thirty technologies with their marks, grouped, scannable in about two seconds,
where the full section took most of a screen and buried the names under their
context. About and Experience lose the least and read fine. Services now shows
the two tracks side by side rather than stacked, which makes the choice between
them the point of the section, which is what it should be.

### Deviations from the spec as written

1. **`SectionLink` was added, and `Projects` adopted it.** Not in the spec's
   file list. Four sections needed the same link-to-its-page button that
   `Projects` had inline from feature 6, and five copies of a button drift.
   `Projects` renders identically; only its markup moved.
2. **Two extractions were written out by hand rather than moved mechanically.**
   Scripted extraction of `ServicesDetail` and `ExperienceTimeline` left a
   `Reveal` wrapper the detail pages must not have, a stale comment, and in the
   second case broken JSX that failed typecheck. Both were rewritten
   deliberately from the original markup. `SkillsIndex` moved cleanly.
3. **`ExperienceTimeline` promotes the role title from `h3` to `h2`.** On the
   home page the role sits under the section's `h2`, so `h3` is right; on
   `/experience` the page's `h1` is the only thing above it, so `h3` would skip
   a level.

### Carried forward

- **Contact is now the only anchor in the navigation**, and it still scrolls
  nowhere. It was already a dead link; this feature makes it conspicuous by
  being the odd one out. Feature 10.
- **Duplicate content is reduced but not zero.** Each summary shares its opening
  sentence and heading with its page. Feature 11 owns canonicals and should
  point each home section's content at its page.
- The employment history still prints and renders unmarked; `Role` has no
  `isPlaceholder`. Unchanged by this feature.
