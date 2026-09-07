# Feature: Services

**From build-plan:** feature 4

**Branch:** feature/services

**Status:** verified

## Goal

Give the two engagement tracks a section that answers the question an Upwork
buyer actually has: what do I get, how long does it take, and how does the work
run. The content already exists and is typed; this feature is the presentation
layer for it.

This is the section that converts a reviewless profile. A skills list says what
the developer knows; a service track says what the buyer receives. It sits below
About and above the projects that will land in feature 6.

## Design reference

`design/website-ui-design.png`. The reference has no services section, so only
its visual language carries over: the eyebrow-and-heading rhythm already built
into `Section`, and the layered card surface used for its feature blocks. Nothing
in the reference dictates this section's layout.

**Layout decision, recorded so review can push back:** each track renders as a
full-width panel, stacked vertically, and splits internally into an identity rail
(name, who it is for, typical timeline) and a body (summary, deliverables,
process). Two side-by-side cards were rejected: each track carries a summary, six
deliverables, and four process steps, which makes two tall unequal columns that
are hard to scan and hard to compare.

## In scope

- `src/components/sections/Services.tsx`, a server component reading `getServices()`
- One panel per service: `name`, `forWho`, `summary`, `typicalTimeline`,
  `deliverables`, `process`
- The `#services` anchor, so the existing header and mobile nav item resolves
- The shadcn `card` primitive, generated once and composed for the panel surface
- Mounting the section on `/` directly below `About`
- Section-level copy (eyebrow, heading, lead) in the component, matching the
  precedent set by `About`

## Out of scope

- **Per-service calls to action.** `#contact` has no target until feature 9. The
  hero already carries the primary CTA. Feature 9 owns adding entry points once
  the contact section exists.
- Editing `src/content/services.ts`, `src/types/content.ts`, or the content
  invariants. Feature 2 owns those shapes and they are read-only here.
- Pricing of any kind, per the project plan.
- Per-service routes or a `/services/[slug]` page. Nothing in the plan calls for
  one, and `getServiceBySlug` exists for feature 6's category filter.
- Skills and experience (feature 5), project cards (feature 6), contact
  (feature 9), metadata (feature 10).
- The two open items from feature 3: unverified proof point numbers and the
  marquee pause control. Both belong to feature 11.

## Build loop

`workflow.stepReview` is `feature`, so build every step, then present one review
packet. `workflow.checkpointCommits` is `disabled`, so make no commits; `/complete`
creates the single feature commit.

`qualityGates.regular` selects nothing automatically for this work: `audit`,
`check`, and `tryGuide` are `manual`, and `independentReview` is `when-sensitive`.
This feature touches no authentication, authorization, payments, secrets, personal
data, migrations, destructive operations, or external side effects, so independent
review is not selected. `verification.uiEvidence` is `when-available` and the
Playwright tools are available, so browser evidence is required. Do not start the
dev server; ask the user to run `npm run dev` before capturing it.

## Build steps

- [x] 1. **Add the `card` primitive.** Run `npx shadcn@latest add card`.
  **Done when:** `src/components/ui/card.tsx` exists, `npx tsc --noEmit` and
  `npm run lint` are clean, and the review packet names every other file the CLI
  touched (`globals.css`, `package.json`, `package-lock.json`) or states that it
  touched none.

- [x] 2. **Section shell and track identity, mounted on `/`.** Create
  `Services.tsx` as a server component: `Section id="services"`, a `ul` with one
  `li` per service from `getServices()` in the order returned, each panel built
  on `Card` and carrying the service `name` as an `h3`, `forWho`, `summary`, and
  `typicalTimeline` under a mono label. Return `null` when `getServices()` is
  empty, so the section never renders an empty heading. Mount it in
  `src/app/page.tsx` below `<About />`.
  **Done when:** `npm run build` succeeds with `/` still marked static, clicking
  "Services" in the header scrolls to the section with its heading clear of the
  sticky header, both track names render with the Figma track first, and `tsc`
  plus `lint` are clean.

- [x] 3. **Panel body: deliverables and process.** Add the deliverables `ul` and
  the process `ol` to each panel. Deliverable markers and step numbers are
  decorative: `aria-hidden="true"`, and never the only thing carrying meaning.
  Step titles are ordinary text, not headings, so the document outline stays
  `h1` hero, `h2` section, `h3` track. Omit either block when its array is empty
  rather than rendering an empty list.
  **Done when:** six deliverables and four numbered steps render for each track,
  the browser accessibility tree shows a list of 2 panels containing a list of 6
  and an ordered list of 4, and `tsc` plus `lint` are clean.

- [x] 4. **Motion, responsive, and accessibility pass.** Wrap the panel list in
  `Reveal` (the section heading is not the LCP element, but keep the wrapper off
  the `Section` heading itself, matching `About`). Verify at 390, 768, and 1440.
  **Done when:** all of the following hold, each with named evidence:
  - No horizontal overflow at 390px (`document.documentElement.scrollWidth`
    equals the viewport width). Long deliverable strings wrap; grid and flex
    children holding text carry `min-w-0`.
  - `text-muted-foreground` on the `--card` surface measures at least 4.5:1 in
    **both** themes. The muted token was tuned against `--background`, and
    `--card` is a lighter surface in dark mode, so this pair has not been checked
    before. If it fails, darken the panel surface or lift the text token rather
    than shipping the pair.
  - A keyboard pass reaches no new tab stop inside the section, since it has no
    interactive elements, and skipping past it lands on the next real control.
  - axe reports no new violations on `/`.
  - `npm test` is green, `npx tsc --noEmit` and `npm run lint` are clean, and
    `npm run build` succeeds with `/` static and First Load JS unchanged from the
    pre-feature figure. Services is a server component reusing the existing
    `Reveal` island, so any client bundle increase means something was pulled in
    by mistake and must be explained before the packet.

## Files / areas

| Path | Change |
|---|---|
| `src/components/sections/Services.tsx` | New. Server component, the whole section |
| `src/components/ui/card.tsx` | New. Generated by the shadcn CLI |
| `src/app/page.tsx` | Modified. Mount `<Services />` below `<About />` |
| `src/content/*`, `src/types/content.ts` | Read only |
| `src/components/primitives/{Section,Reveal}.tsx` | Read only, reused as built |
| `src/lib/site.ts` | Read only. Supplies the `#services` anchor contract |

## Data / contracts

- `getServices()` returns `readonly Service[]` **already sorted ascending by
  `order`**, which puts `figma-to-nextjs` first. Render in the returned order and
  do not sort again in the component; the ordering rule stays in one place.
- Fields consumed: `slug` (React key only, never rendered), `name`, `forWho`,
  `summary`, `deliverables: readonly string[]`, `typicalTimeline: string`,
  `process: readonly { title, detail }[]`.
- No new content fields, no new accessors, no schema change. If the section wants
  a value the `Service` type does not carry, that is a signal to stop, not to add
  a field.
- All strings are author-supplied and render as React text nodes. No
  `dangerouslySetInnerHTML` anywhere in this feature.

### States

| State | Behaviour |
|---|---|
| Happy | Two panels, each with summary, deliverables, timeline, process |
| Empty services | Section returns `null`. Unreachable today, required so the shell can never render alone |
| Empty `deliverables` or `process` on a service | That block is omitted, not rendered as an empty list |
| Loading, invalid, denied, error | Not applicable. Static server render, no fetch, no user input, no authorization boundary |

## Testing

**No new unit tests, and that is the correct outcome.** The test gate requires a
test when a step adds in-scope logic; this feature adds presentation only, and the
accessors it consumes (`getServices` ordering, the duplicate-order invariant) are
already covered in `tests/content/index.test.ts`. `npm test` must stay green at
48 passing tests.

If a step turns out to need real logic, do not inline it in the component: put it
in a module under `src/lib/` and ship `tests/lib/<name>.test.ts` in the same diff,
per the `tests/` mirroring rule in `AGENTS.md`.

Browser evidence, with the dev server started by the user:

- Screenshots of the section at 390, 768, and 1440
- Accessibility tree snapshot showing the list structure and heading levels
- Computed contrast for muted text on the card surface, both themes
- axe run on `/`
- Header nav "Services" click landing on the section

There is no `Browser tests` command configured, so this is manual Playwright
evidence, not an automated suite.

## Notes for the AI

- Section-level copy lives in the component, like `About`. Proposed strings,
  reviewable as part of the packet:
  - label: `Services`
  - heading: `Two ways to work with me`
  - lead: `Both tracks run the same way: small reviewable pieces, a staging URL
    you can open at any point, and a handover that leaves you able to change
    things without me.`
  Every claim in that lead is backed by a `process` step in the content. Do not
  add a claim the content does not support.
- `src/content/services.ts` still carries its `PLACEHOLDER CONTENT` comment. The
  copy renders as written. Surface it at review as a user decision; it does not
  block this build, because describing a service you can deliver is not the same
  as claiming work you have not done.
- Compose `Card` through `className`. Do not restructure the generated file. If a
  token-level retune is genuinely needed, say so in the packet rather than editing
  it silently.
- The feature 3 overflow lesson applies: a grid or flex child containing text
  needs `min-w-0`, because grid items default to `min-width: auto` and long
  strings then set the column floor.
- Reduced motion is handled globally by `MotionConfig reducedMotion="user"` in
  `MotionProvider`. Do not branch rendering on `useReducedMotion()`; that is what
  caused the feature 1 hydration mismatch.
- Use Context7 for any shadcn, Tailwind v4, or Next.js API question, including
  ones that feel obvious.

## Verification record

Measured on the dev server the user already had running on port 3000. No server
was started by this build.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | clean |
| `npm test` | 48 passed, 2 files. No new tests, as specced |
| `npm run build` | succeeds, `/` still `○ (Static)` |
| Client JS on `/` | 738,939 bytes across 10 script tags, byte-identical to the pre-feature baseline |
| Overflow at 390 / 768 / 1440 | `scrollWidth` equals `clientWidth` at all three |
| Muted text on card, light | 6.57:1 |
| Muted text on card, dark | 7.44:1 |
| Brand check icon on card | 7.16:1 light, 8.78:1 dark, above the 3:1 non-text minimum |
| Focusable elements inside `#services` | 0, so the section adds no tab stop |
| Heading order | H1 hero, H2 About, H2 Services, H3, H3. No skips |
| axe 4.10.2, WCAG 2.0/2.1/2.2 A+AA plus best-practice | 0 violations, 42 rule groups passing |
| axe incomplete | 8 nodes, all pre-existing and outside this section: the hero marquee pills and the footer logo link |
| Header nav "Services" | Resolves to `#services`, heading lands 328px down, clear of the 65px sticky header |
| Per panel | 6 deliverables, 4 process steps in an `ol`, timeline `dt`/`dd` correct |

### Deviations from the spec as written

1. **First Load JS was not readable from the build output.** Next 16 with
   Turbopack no longer prints the size column, so that done-when could not be
   observed as written. Substituted a stricter, reproducible measurement: sum the
   bytes of every JS chunk referenced by the prerendered `/` HTML, captured before
   and after. Script at
   `scratchpad/first-load.sh`.
2. **The card surface contrast concern did not materialise.** Light `--card` is
   `oklch(1 0 0)`, which is lighter than the page background, so muted text gains
   contrast there rather than losing it. No token change was needed.
3. **`role="list"` added to all three lists.** Tailwind preflight sets
   `list-style: none`, which makes WebKit drop list semantics. Existing sections
   (hero tech row, credibility strip) have the same gap and were left alone;
   feature 11 should sweep them.
4. **`.playwright-mcp/` added to `.gitignore`.** The MCP browser tools write
   screenshots, snapshots, and console logs into the project root, which would
   otherwise be swept into this feature's commit.
