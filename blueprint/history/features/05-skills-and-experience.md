# Feature: Skills and experience

**From build-plan:** feature 5

**Branch:** feature/skills-and-experience

**Status:** verified

## Goal

Two sections that answer "can this person actually do the work", using the two
things a reviewless profile can still offer: where each technology was used, and
a dated work history.

The overview is explicit that this ranks below proof of delivery, which is why
projects sit above it on the page. Skills here is a supporting exhibit, not the
argument.

## Design reference

`design/website-ui-design.png`. Card and chip language only.

**The reference's skills treatment is the thing this feature must not copy.** It
uses percentage bars ("React 85%"), and `project-plan.md` removed them: a
self-assigned score is filler, and on a site whose whole pitch is evidence it is
the same failure mode as the fake client-count tiles. No proficiency value of any
kind ships in this feature, in any form, including stars, dots, ordering by
strength, or "primary" labels. The `Skill` type carries no such field, by design.

The reference has no experience section at all, so the timeline is ours.

## In scope

- `src/lib/dates.ts`: `YYYY-MM` formatting for role dates, with tests
- `src/components/sections/Skills.tsx`: the five groups, each skill with its
  usage context and its mark where one exists
- `src/components/sections/Experience.tsx`: the dated role timeline
- The `#skills` and `#experience` anchors, so both remaining same-page nav items
  resolve
- The shadcn `badge` primitive, for role stack chips
- Mounting both sections on `/` below `Services`

## Out of scope

- **Editing `src/content/skills.ts` or `src/content/experience.ts`.** Both carry
  PLACEHOLDER markers. The contexts and the work history are the user's to
  correct, and `experience.ts` warns that an invented history is the one thing on
  this site that cannot be walked back. Surface both at review.
- **`/resume` (feature 8)**, even though it will reuse `dates.ts`. Build the
  formatter for this feature's need only.
- Computed durations ("2 yrs 3 mos"). Nothing in the content or the plan asks for
  one, and it is arithmetic on dates that no one requested.
- Filtering, search, or sorting controls on either section.
- Any link out of a skill or role. `#projects` and `#contact` still have no
  target; features 6 and 9 own them.
- Adding `role="list"` to the hero technology row and credibility strip. Same gap,
  but sweeping it belongs to feature 11.
- Re-sorting roles. `getRoles()` already returns them reverse-chronological.

## Build loop

`workflow.stepReview` is `feature`: build every step, then one review packet.
`workflow.checkpointCommits` is `disabled`, so make no commits; `/complete` makes
the single feature commit.

`qualityGates.regular` selects nothing automatically. `audit`, `check`, and
`tryGuide` are `manual`; `independentReview` is `when-sensitive` and this feature
touches no authentication, authorization, payments, secrets, personal data,
migrations, destructive operations, or external side effects.

`verification.logicTests` is `when-configured` and Vitest **is** configured, so
step 2 cannot be checked off without passing tests in the same diff.
`verification.uiEvidence` is `when-available` and Playwright is available, so the
UI steps need browser evidence. Do not start a dev server: use the one the user
already has running, or ask.

## Build steps

- [x] 1. **Add the `badge` primitive.** Run `npx shadcn@latest add badge`.
  **Done when:** `src/components/ui/badge.tsx` exists, `npx tsc --noEmit` and
  `npm run lint` are clean, and the packet names every other file the CLI touched
  (`globals.css`, `package.json`, `package-lock.json`) or states that it touched
  none. Compare hashes before and after, as feature 4 did.

- [x] 2. **`src/lib/dates.ts` and its tests.** This is the logic step and the
  test gate applies. Two exports, no more:
  - `formatYearMonth(value: string): string` maps `"2024-06"` to `"Jun 2024"`.
    Throws `RangeError` on anything that is not `YYYY-MM` with a month in 01-12,
    including the `"present"` sentinel, which is not a year-month.
  - `formatRoleEnd(end: string): string` returns `"Present"` for the exact
    sentinel `"present"`, otherwise delegates to `formatYearMonth`.

  **No `Date` and no `Intl`.** A hardcoded English month table only. `Intl`
  resolves its locale from the environment, so the build server and the browser
  can disagree, which is both a hydration mismatch and a test that passes only on
  the machine that wrote it. The `Role` type already says strings, never `Date`,
  so there is no timezone drift.

  Note in the file that `content/index.ts` holds an equivalent private
  `YEAR_MONTH_PATTERN`. This is a real duplication and nothing guards the two
  against drifting; consolidating means editing feature 2's module and is not
  worth doing inside this feature.

  **Done when:** `tests/lib/dates.test.ts` passes as part of `npm test`, asserting
  exact output strings (not a locale-derived expectation), all twelve months, the
  `"present"` sentinel, and that `"2024-13"`, `"2024-1"`, `"24-06"`, `""`, and
  `"present"` each throw from `formatYearMonth`. Total test count rises from 48.

- [x] 3. **Skills section, mounted at `#skills`.** Server component reading
  `getSkillGroups()`, rendering groups in the order returned. One `Card` per
  group: the group `label` as an `h3`, then a `dl` where each `dt` is the skill
  mark plus name and each `dd` is its `context`. A `dl` is the correct element
  here: every row is a term and its description.

  Nine of the thirty skills have no `icon`. Reserve the mark slot so every name
  starts at the same x rather than letting rows with no icon shift left. Use
  `hasTechIcon` from `src/components/icons/TechIcon.tsx` rather than testing the
  field directly, so the registry stays the single source of truth about which
  marks exist. Marks are decorative: `aria-hidden`, with the name as the text.

  Return `null` when there are no groups; skip a group whose `skills` array is
  empty rather than rendering an empty card.

  **Done when:** `npm run build` succeeds with `/` still static, the header
  "Skills" link scrolls to the section, all five group labels and all thirty
  context lines render, no row shows any proficiency value, and `tsc` plus `lint`
  are clean.

- [x] 4. **Experience section, mounted at `#experience`.** Server component
  reading `getRoles()`, rendered in the order returned, which is
  reverse-chronological. An `ol`, because the order is meaningful. Per role: an
  `h3` carrying title and company, the date range, `summary`, the `impact` list,
  and the `stack` as `Badge` chips.

  Dates render as real `<time>` elements: `<time dateTime={role.start}>` around
  `formatYearMonth(role.start)`, and either `<time dateTime={role.end}>` or plain
  `Present` text for an ongoing role, since `"present"` is not a valid
  `datetime` value. Separator is a plain ASCII hyphen.

  Return `null` when there are no roles; omit an empty `impact` or `stack` block
  rather than rendering an empty list.

  **Done when:** the header "Experience" link resolves, all three roles render
  newest first with correct dates ("Jun 2024 - Present", "Sep 2022 - May 2024",
  "Mar 2021 - Aug 2022"), each `<time>` carries the raw `YYYY-MM` in `dateTime`,
  and `tsc` plus `lint` are clean.

- [x] 5. **Motion, responsive, and accessibility pass.** Wrap each group card and
  each role entry in `Reveal`, matching the per-panel pattern from feature 4.
  **Done when:** all of the following hold, each with named evidence:
  - No horizontal overflow at 390, 768, and 1440.
  - `role="list"` on every new list, since Tailwind preflight sets
    `list-style: none` and WebKit then drops list semantics.
  - Heading order stays h1, h2, h3 with no skips. Group labels and role titles
    are both `h3` under their section's `h2`.
  - Any new token pair on the card surface measures at least 4.5:1 in both
    themes, and any `Badge` variant used measures at least 4.5:1 for its text and
    3:1 for its boundary if that boundary is the only thing separating it from
    the surface.
  - axe reports no new violations on `/`.
  - `npm test`, `npx tsc --noEmit`, `npm run lint` clean, `npm run build`
    succeeds with `/` static.
  - Client JS for `/` is unchanged except for what `Reveal` already costs. Both
    sections are server components. Measure the same way feature 4 did: sum the
    bytes of every JS chunk referenced by the prerendered `/` HTML, before and
    after. The pre-feature figure is 738,939 bytes across 10 script tags.

## Files / areas

| Path | Change |
|---|---|
| `src/lib/dates.ts` | New. `formatYearMonth`, `formatRoleEnd` |
| `tests/lib/dates.test.ts` | New. The logic gate for step 2 |
| `src/components/sections/Skills.tsx` | New. Server component |
| `src/components/sections/Experience.tsx` | New. Server component |
| `src/components/ui/badge.tsx` | New. Generated by the shadcn CLI |
| `src/app/page.tsx` | Modified. Mount both below `<Services />` |
| `src/content/*`, `src/types/content.ts` | Read only |
| `src/components/icons/TechIcon.tsx` | Read only. `TechIcon`, `hasTechIcon` |
| `src/components/primitives/{Section,Reveal}.tsx` | Read only |

## Data / contracts

- `getSkillGroups()` returns the five groups in `skills.ts` order, which the file
  states is canonical and which the hero technology row also reads. Render in
  that order; do not sort.
- `getRoles()` returns roles sorted by `start` descending, newest first, with
  array order preserved for ties. Do not sort again in the component.
- `Skill` is `{ name, context, icon? }` and carries **no** proficiency field. If
  a layout wants one, that is a signal to stop.
- `Role` is `{ id, company, title, start, end, summary, impact[], stack[] }`.
  `start` is `YYYY-MM`; `end` is `YYYY-MM` or the exact sentinel `"present"`.
  Both are enforced by `assertContentInvariants` at module scope, so malformed
  dates fail `npm run build` during static generation rather than rendering.
- `role.id` is the React key for timeline entries. `skill.name` is the key within
  a group; `group.id` is the key across groups.
- New formatter contract, pinned because feature 8 will reuse it:

  | Input | `formatYearMonth` | `formatRoleEnd` |
  |---|---|---|
  | `"2024-06"` | `"Jun 2024"` | `"Jun 2024"` |
  | `"present"` | throws `RangeError` | `"Present"` |
  | `"2024-13"`, `"2024-1"`, `"24-06"`, `""` | throws `RangeError` | throws `RangeError` |

  Month names are the three-letter English forms Jan through Dec, from a literal
  table. Output is locale-independent and identical on server and client.
- All strings are author-supplied and render as React text nodes. No
  `dangerouslySetInnerHTML`.

### States

| State | Behaviour |
|---|---|
| Happy | Five group cards, three role entries |
| No skill groups / no roles | That section returns `null` |
| A group with no skills | Skipped, not rendered as an empty card |
| A role with empty `impact` or `stack` | That block omitted, not an empty list |
| Malformed role date | Unreachable at runtime: the content invariant throws at import, failing the build. `formatYearMonth` throws as a developer guard |
| Loading, denied, unexpected error | Not applicable. Static server render, no fetch, no input, no authorization boundary |

## Testing

`tests/lib/dates.test.ts` is **required** in the same diff as `src/lib/dates.ts`.
Assert literal expected strings so the test cannot pass by agreeing with whatever
locale the runner happens to have. Cover all twelve month mappings, the
`"present"` sentinel through `formatRoleEnd`, and each malformed input throwing.

No tests for the two section components: they are presentation over accessors
already covered in `tests/content/index.test.ts`, and `AGENTS.md` exempts UI and
layout in favour of browser evidence.

Browser evidence, on the dev server the user is already running:

- Screenshots of both sections at 390, 768, 1440
- Accessibility tree showing the `dl` structure, the `ol`, and heading levels
- Rendered date strings and `dateTime` attributes read from the DOM
- axe on `/`
- Header nav "Skills" and "Experience" both landing on their sections

There is no `Browser tests` command, so this is manual Playwright evidence.

## Notes for the AI

- **Section order contract.** The overview fixes `/` as hero, credibility strip,
  about, services, **projects**, skills, experience, contact. Projects does not
  exist yet, so mount Skills and Experience directly below Services now. Feature
  6 inserts Projects between Services and Skills. Say so in a comment in
  `page.tsx`, as the existing comment there already does for later sections.
- After this feature, four of the six `NAV_ITEMS` anchors resolve. Only
  `#projects` and `#contact` still dangle, both by design.
- `Reveal` per card and per role entry, not one wrapper around the list, so each
  enters on its own scroll position. Feature 4 established this.
- Reduced motion is handled globally by `MotionConfig reducedMotion="user"`. Do
  not branch rendering on `useReducedMotion()`.
- `min-w-0` on any grid or flex child holding text.
- Compose `Card` and `Badge` through `className`; do not restructure a generated
  file. If a token-level retune is genuinely needed, say so in the packet.
- `CardTitle` renders a div and takes no `asChild`, so group labels and role
  titles are plain `h3` elements, as in `Services.tsx`.
- The skill `context` lines are the entire reason this section exists. If one
  reads as filler, that is content feedback for the user, not a reason to hide
  the field.
- Use Context7 for any shadcn, Tailwind v4, Next.js, or Vitest API question.

## Verification record

Measured on the dev server the user already had running on port 3000. No server
was started by this build.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | clean |
| `npm test` | 63 passed across 3 files, up from 48. 15 new tests in `tests/lib/dates.test.ts` |
| `npm run build` | succeeds, `/` still `○ (Static)` |
| Client JS on `/` | 738,939 bytes across 10 script tags, byte-identical to before the feature |
| Overflow at 390, 768, 1440 | `scrollWidth` equals `clientWidth` at each |
| Skills structure | 5 groups, 30 `dt`/`dd` pairs, 21 marks, matching the content exactly |
| Experience structure | 3 roles newest first, 3 impact items each, 5/4/4 stack chips |
| Dates rendered | "Jun 2024 - Present", "Sep 2022 - May 2024", "Mar 2021 - Aug 2022" |
| `<time datetime>` | Raw `YYYY-MM` on every dated endpoint. The ongoing role emits one `<time>` and plain "Present" text, since the sentinel is not a valid datetime |
| Badge text contrast | 15.21:1 light, 14.29:1 dark |
| Brand company line and list markers | 6.96:1 light, 9.40:1 dark |
| Focusable elements in either new section | 0, so neither adds a tab stop |
| Heading order | H1, then H2/H3 per section, no skips, 15 headings total |
| axe 4.10.2, WCAG 2.0/2.1/2.2 A+AA plus best-practice, **both themes** | 0 violations, 42 rule groups passing, 0 incomplete nodes inside either new section |
| Nav "Skills" and "Experience" | Both resolve, headings land at 328px, clear of the 65px sticky header |

### Deviations from the spec as written

1. **`hasTechIcon` is now a type predicate.** The spec listed
   `TechIcon.tsx` as read-only and required using `hasTechIcon` so the registry
   stays the single source of truth, but the function returned plain `boolean`,
   so TypeScript could not narrow `skill.icon` from `string | undefined` and the
   call did not compile. Changed the signature to `icon is string`, which is what
   the check actually asserts. Runtime behaviour is unchanged and Skills is its
   only caller.
2. **Three exports from `dates.ts`, not two.** `PRESENT` is exported alongside the
   two formatters. The component has to distinguish an ongoing role from a dated
   one to decide between `<time>` and plain text, and comparing against a bare
   `"present"` literal in the component would put the sentinel in two places.
3. **The experience layout was restructured mid-build.** The first version put
   dates inside the content column, which left the right 40% of the section empty
   at desktop while Services and Skills both fill the width. Dates moved to a
   left rail at `lg`, echoing the Services panel. The timeline stays continuous
   because each entry draws its own left border and pads its bottom, rather than
   the list drawing one border interrupted by gaps.
4. **Rail width raised from 9rem to 12rem** after the first capture showed
   "Sep 2022 - May 2024" wrapping to two lines against a right-aligned edge.

### Evidence note for later features

The first opacity measurement showed one skill card at `opacity: 0` while its
siblings were at 1. That was an artifact of the measurement, not a defect: a
synchronous loop of `scrollIntoView` calls only ever renders the final scroll
position, so an IntersectionObserver never sees the intermediate ones. Stepping
down the page in increments with a frame between each reproduces what a reader
does, and all eight revealed elements then reach opacity 1. Use the stepped
scroll when gathering evidence for anything wrapped in `Reveal`.
