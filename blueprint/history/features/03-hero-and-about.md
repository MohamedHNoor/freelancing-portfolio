# Feature: Hero and about

**From build-plan:** feature 3

**Branch:** feature/hero-and-about

**Status:** verified

## Goal

Replace the placeholder home page with the first two things a visitor actually
reads: a hero that says who this is and what they build, and an about section
that says how they work. Between them sits the credibility strip, which is this
site's substitute for the reviews the account does not have yet.

The overview calls this the first-impression gate: if it fails, nothing below it
gets read. It is also the only place a visitor confirms whose site this is, since
the header shows the monogram alone.

## Design reference

`design/website-ui-design.png`. Take the eyebrow-and-heading rhythm, the layered
card language, and the code-editor motif in the hero.

Two deliberate departures, both already settled in `project-plan.md`:

- **No stat tiles.** The reference's "30+ Happy Clients" and "100% Client
  Satisfaction" are false at zero completed jobs. The credibility strip replaces
  them with claims that name their own evidence.
- **No portrait.** The reference builds its hero around a photo. None has been
  supplied, and inventing one is not an option, so the hero is text-led with the
  code card as the visual anchor in the right column. A real photo later slots
  into that column without a rewrite.

## In scope

- `Section` and `StatusPill` primitives, shared with features 4 to 9
- Hero: name, dual-track headline, availability pill, two calls to action
- Hero code card, decorative, values drawn from `profile`
- Credibility strip rendered from `profile.proofPoints`, with evidence visible
- About section at `id="about"`, rendered from `profile`
- Rewriting `src/app/page.tsx` to assemble them in the overview's order

## Out of scope

- Services, projects, skills, experience, and contact sections. Features 4 to 9.
- The `#services`, `#projects`, `#skills`, `#experience`, and `#contact` anchor
  targets. This feature only creates `#about`.
- Any change to `NAV_ITEMS`, the header, the footer, or the mobile sheet.
- A real photo, and any image work beyond what already exists.
- Per-route metadata, Open Graph, and structured data. Feature 10.
- Lighthouse scoring and the bundle budget. Feature 11 owns the numeric gate.
- ~~Editing `profile.ts` copy.~~ **Reopened on review at the user's request**,
  who asked for the hero content to be improved alongside its layout. See What
  changed during implementation.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is
`disabled`. Implement the steps in order without stopping for approval after
each, then present one review packet. No checkpoint commits. `/complete` creates
the single feature commit.

## Build steps

Each step leaves the page renderable, so nothing is built that the running app
cannot reach.

- [x] 1. **Shared primitives.** Add `src/components/primitives/Section.tsx` and
  `src/components/primitives/StatusPill.tsx` to the contracts in Data /
  contracts. Both are server components.
  **Done when:** `npx tsc --noEmit` and `npm run lint` are clean, and `Section`
  renders a `section` with the given `id`, an eyebrow, and exactly one `h2`.

- [x] 2. **Hero, and the page it lives on.** Add
  `src/components/sections/Hero.tsx` and replace the placeholder body of
  `src/app/page.tsx` with it. Name, headline, short bio, availability pill, and
  the two calls to action. None of these are wrapped in `Reveal`; see Notes.
  **Done when:** `/` renders one `h1` containing the developer's name; the
  headline names the Figma track before the platform track; the availability
  pill shows the seeded status; both calls to action are keyboard reachable with
  a visible focus ring; and no placeholder design-system copy remains.

- [x] 3. **Hero code card.** Add `src/components/sections/HeroCodeCard.tsx`,
  values read from `profile`, and place it in the hero's second column. This is
  the one hero element with a staged entrance.
  **Done when:** at 1440 the card sits beside the hero text and at 390 it stacks
  below it without horizontal overflow; the card is `aria-hidden` and the
  keyboard tab order skips it; and with `prefers-reduced-motion: reduce`
  emulated it appears with no transform.

- [x] 4. **Credibility strip.** Add
  `src/components/sections/CredibilityStrip.tsx` and place it directly after the
  hero, per the overview's route order. Each entry shows value, label, and
  evidence.
  **Done when:** all three seeded proof points render with their evidence text
  visible on the page rather than behind a tooltip or a title attribute; and,
  demonstrated once and then reverted, an empty `proofPoints` array renders no
  strip at all rather than an empty container.

- [x] 5. **About.** Add `src/components/sections/About.tsx` at `id="about"`,
  rendering `shortBio` as the lead, each `longBio` paragraph, and `location`.
  **Done when:** clicking About in both the desktop navigation and the mobile
  sheet scrolls to the section with its heading clear of the sticky header; the
  heading order on `/` reads h1 then h2 with no skipped level; and, demonstrated
  once and then reverted, an empty `longBio` renders the lead alone with no
  empty paragraphs.

- [x] 6. **Availability states.** Confirm all three `AvailabilityStatus` values
  render correctly, not only the seeded one.
  **Done when:** temporarily setting `profile.availability.status` to `limited`
  and then `unavailable` renders the labels in Data / contracts, each
  distinguishable without relying on colour; the seeded value is restored
  afterwards; and contrast for each pill's text against its own background is at
  least 4.5:1 in both themes, with the measured ratios recorded.

- [x] 7. **Verification pass.** Confirm the feature holds and feature 1 and 2
  did not regress.
  **Done when:** `npm test`, `npx tsc --noEmit`, `npm run lint`, and
  `npm run build` are clean; `/` is still statically generated in the build route
  table; screenshots exist at 390, 768, and 1440 in both themes; there are no
  console errors; and the theme toggle, skip link, and mobile sheet still behave
  as they did at the end of feature 2.

## Files / areas

Created:

- `src/components/primitives/Section.tsx`
- `src/components/primitives/StatusPill.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/sections/HeroCodeCard.tsx`
- `src/components/sections/CredibilityStrip.tsx`
- `src/components/sections/About.tsx`

Modified:

- `src/app/page.tsx` - assembles hero, credibility strip, about

Untouched: the content layer, the header, the footer, the mobile sheet,
`NAV_ITEMS`, and `globals.css`.

## Data / contracts

**Everything renders from `@/content`.** No section may hard-code a string that
belongs to `profile`. All four sections are server components; this feature adds
no client component, because `Reveal` is the only interactive piece and it
already exists.

**`Section` primitive**, the contract features 4 to 9 inherit:

| Prop | Type | Meaning |
|---|---|---|
| `id` | `string` | The anchor target, matching a `NAV_ITEMS` href |
| `label` | `string` | Eyebrow text above the heading |
| `heading` | `string` | Rendered as `h2`, always, since the hero owns the `h1` |
| `lead` | `string?` | Optional paragraph under the heading |
| `children` | `ReactNode` | Section body |

It renders `<section id={id}>` with `aria-labelledby` pointing at the heading, so
the section is a named region rather than an anonymous block.

**`StatusPill` and the three availability states.** All three are implemented
now, not only the seeded one. Meaning is carried by the label text, with tone and
dot style reinforcing it, never by colour alone.

| `status` | Label | Treatment |
|---|---|---|
| `available` | Available for work | Brand tone, filled dot |
| `limited` | Limited availability | Muted tone, half-filled dot |
| `unavailable` | Not taking new work | Muted tone, hollow dot |

`availability.detail` renders beside the pill when non-empty and is omitted
entirely when empty. No new colour token is introduced; the existing `brand`,
`muted`, and `muted-foreground` tokens cover all three.

**Credibility strip.** One entry per `ProofPoint`, rendering `value`, `label`,
and `evidence`. **Evidence is visible body text**, never a tooltip or a `title`
attribute: it is unreachable on touch and by keyboard, and it is the exact thing
that makes the number credible. An empty `proofPoints` array renders nothing at
all, not an empty container or a heading with no body.

**Hero code card.** Keys are fixed presentational labels; every value comes from
`profile` (`name`, `specialisms`, `location`, `availability.status`). It carries
`aria-hidden="true"` and is not focusable, because every fact in it already
appears in the hero text, the availability pill, or the about section, and
repeating them would only add screen reader noise.

**Calls to action.** Primary "Start a project" targets `#contact`; secondary
"See case studies" targets `#projects`. Neither target exists until features 9
and 6, so both are inert for now. They are anchors, so nothing 404s, and this is
a known temporary state rather than a defect.

**Section order on `/`**, fixed by the overview: hero, credibility strip, about.
The credibility strip is its own band between the two, not part of the hero.

**Security.** No user input, no forms, no runtime data, no authenticated actor,
no tenant boundary. Every string is authored in-repo and imported at build time,
so there is no untrusted text and no injection surface.

## Testing

`npm test` (Vitest) is a declared command, so the gate is on. This feature adds
**no in-scope logic**: the sections read existing helpers and render, and the
status-to-label mapping is presentational, which the coding standards place out
of scope for unit tests. No test files are added, and that is a deliberate call
rather than a skipped gate.

The existing 40 tests must still pass. Verification is `npm test`,
`npx tsc --noEmit`, `npm run lint`, `npm run build`, and browser evidence through
the Playwright MCP tools against the dev server, at 390, 768, and 1440 in both
themes.

If a step turns out to need real logic, add a focused test in
`tests/` under the mirrored path in the same reviewable diff.

## Notes for the AI

- **The `h1` is the largest contentful element.** It must not be wrapped in
  `Reveal`, must not start at `opacity: 0`, and must not be animated in any way.
  This is the carried note from feature 1.
- **Do not wrap the availability pill or the calls to action in `Reveal`
  either.** `Reveal` server-renders `opacity: 0`, so anything inside it is
  invisible until JavaScript runs. That is acceptable for decorative content
  below the fold; it is not acceptable for the primary action of a page whose
  only job is converting a visitor into an enquiry. The code card is the one
  hero element with an entrance, and it is decorative.
- Below the fold, `Reveal` is fine for the credibility strip and about.
- Reduced motion is already handled globally by `MotionConfig` in
  `MotionProvider`. Do not add per-component `useReducedMotion` branching; it
  desynchronises hydration, which is why it was removed in feature 1.
- The name must appear prominently in the hero. The header carries only the
  monogram, so this is the sole place a visitor confirms whose site this is.
- Read content through `getProfile()`, never by importing `src/content/profile`
  directly.
- No prices, rates, proficiency percentages, client counts, or testimonials.
- The seeded proof point values are unverified placeholders. Render them as they
  are; correcting them is feature 11's job, not this feature's.

## Open questions

None blocks implementation.

- **Real profile copy.** Everything renders seeded content, already flagged in
  the overview's open questions. Swapping it changes no component.
- **A photo.** None supplied, so the hero is designed without one. If you want a
  portrait later, it drops into the code card's column and is a small change,
  not a redesign.

## What changed during implementation

Four things differ from the spec as written. Three were defects the checks
caught; the fourth is a verification method worth keeping.

1. **`shortBio` was dropped from the hero.** I added it while writing `Hero.tsx`,
   then removed it: the In scope list never included it, the headline already
   says the same thing in different words, and the spec assigns `shortBio` to
   About as the section lead. Showing it twice within one screen of itself was
   the actual problem.

2. **The `h1` ran two strings together.** With the name and the headline as
   adjacent block spans, the heading's text content read
   `"Mohamed NoorI turn Figma files into..."`, so assistive technology could
   announce them as one word. Fixed with explicit whitespace between the spans,
   which changes nothing visually because both are block-level.

3. **Horizontal overflow at 390px.** The hero grid collapses to one column on
   mobile, and grid items default to `min-width: auto`, so the code card's
   `<pre>` set the column's floor and dragged the hero text out to 380px inside
   a 390px viewport. `min-w-0` on both grid children fixes it. `overflow-x-auto`
   on the `<pre>` alone was not enough, because the intrinsic width still sized
   the track.

4. **Full-page screenshots do not prove a scroll reveal rendered.** A `fullPage`
   capture records `whileInView` content in its pre-reveal state, showing an
   empty band where About should be. Evidence for any section wrapped in
   `Reveal` has to scroll the page first and let the 500ms animation finish.
   `Reveal`'s `once: true` was separately confirmed correct: opacity stays 1
   after the element leaves the viewport again.

## Hero rework, requested on review

The first build of the hero was rejected on review. Compared against
`design/website-ui-design.png`, the diagnosis was that the reference headline is
two short lines of roughly five words, while ours was a thirteen-word sentence
set at display size and wrapping to six lines. It read as a paragraph in large
type rather than as a headline, and there was no supporting copy, no technology
row, and nothing anchoring the right column.

**Content.** Two `profile.ts` strings changed, which the spec had put out of
scope until the user reopened it:

- `headline` went from thirteen words to eleven and now fits four display lines
  instead of six. It still leads with the Figma track, as the overview requires.
- `shortBio` stopped restating the headline and now answers what a buyer
  actually wants to know: the design is matched, the performance budget is kept,
  and a keyboard test happens before handover. It serves as the hero's
  supporting paragraph and the footer descriptor.

Because `shortBio` moved into the hero, About dropped it as a section lead;
otherwise the same sentence appeared twice within one screen of itself.

**Layout**, taken from the reference:

- Availability pill and its detail sit together on one line at the top
- The name is a brand-toned monospace eyebrow inside the `h1`, which keeps it
  prominent without competing with the headline
- A supporting paragraph now sits between the headline and the calls to action
- The primary call to action carries an arrow, as in the reference
- A technology row grounds the column, letting a buyer check the stack in one
  glance
- A violet glow anchors the right column, standing in for the reference's glow
  behind its portrait. It is clipped by the section, so it cannot widen the page

**Two content-layer helpers were added** rather than hard-coding the technology
row: `uniqueStack(projects)` deduplicates in first-appearance order, and
`getFeaturedStack(limit?)` applies it to the featured projects. The row therefore
lists what the shown work actually used. Six tests cover them, driven by fixtures
for the ordering rules.

**Three defects found while iterating on the rework:**

1. The technology row label was an `h2`, which put a minor hero label at the
   same outline level as the About section heading. It is now a paragraph, with
   the list labelled by it.
2. The code card's `stack:` line overflowed the card and was visibly clipped.
   The array now wraps one entry per line, which also matches how the reference
   wraps its own array.
3. A `max-w-[19ch]` measure on the headline was forcing extra line breaks
   independently of the copy length. Removing it let the grid column govern.

## Headline reduced to two lines, requested on review

The user asked for a two-line display headline and, in a follow-up, for the
platform track to move out of the headline and into the supporting paragraph.

**The constraint was arithmetic, not taste.** The hero text column is 624px at
1440 and 358px at 390. At the display sizes in play that is roughly 20 to 24
characters per line, so a two-line headline had a budget of about 44 characters
while still naming both tracks. Every dual-track phrasing that fit was either
vague ("Platforms that hold up") or overclaimed a compliance property that
cannot yet be evidenced ("Audit-ready platforms"), which is the failure mode
this site exists to avoid. Moving the second track into the paragraph removed
the constraint instead of fudging it.

**Final copy:**

- `headline`: "Figma files in. Production Next.js out." Two clauses of 15 and 23
  characters, so the line break falls on the full stop at every width. The
  transformation framing names both what the buyer has and what they get, in the
  words they search with.
- `shortBio` now carries the platform track plus the delivery promises, so the
  hero as a whole still positions both tracks even though the headline names
  only the first. This is a deliberate departure from the overview's
  "one-sentence dual-track positioning" line, which assumed the headline string
  alone would carry it.

**Type now follows the measure rather than the breakpoint name.** The column
narrows when the grid splits at `lg`, so the size steps down there and back up
at `xl`. Below `sm` it is fluid, `clamp(1.55rem, 7.5vw, 2rem)`, because a fixed
mobile size orphaned the word "Production" on its own line at 390 and narrower.

Measured at fourteen widths from 320 to 1920: two lines at every one except
900px, where the single-column layout gives a wide enough measure for one. No
horizontal overflow and no code-card clipping at any width.

## Technology row: content, marquee, and marks

Three further requests on review: add a named list of technologies, scroll them
right to left continuously, show each with its icon, and type the code card out.

**The row's meaning changed, so its source did.** It previously derived from the
featured projects' stacks, which made it "what the shown work used". The
requested technologies are not in those placeholder projects, so the row now
reads the skill groups instead, which is what its "Working with" label always
claimed. `getFeaturedStack` and `uniqueStack` were removed rather than left as
dead exports; `uniqueSkills` and `getTechnologyMarks` replace them, with the
same fixture-driven tests for ordering and dedup.

`skills.ts` gained JavaScript, Express.js, MongoDB, Supabase, Neon, Drizzle,
Prisma and Docker as asked, plus shadcn/ui, React Hook Form, Zod, Vitest,
Playwright, GitHub Actions and Vercel, which sit in the same stack. Every
`context` line is still placeholder and describes the kind of use, not a
specific engagement.

**Icons come from `simple-icons`**, a data-only package of official brand paths.
Hand-drawing twenty-one logos from memory would have produced approximations of
real trademarks. It is imported in a server component, so it never reaches the
client bundle, which the build output confirms. Marks render in `currentColor`
rather than each brand's own hex: several are near-black or near-white and would
vanish in one theme or the other, and one tone reads as a set rather than a
sticker sheet.

Not every entry has a mark. Playwright has no icon in the set, and REST APIs,
Server Actions, Authentication, Audit logging and Accessibility are capabilities
rather than products. All of them stay in the skills section for feature 5 and
are excluded from a row of logos.

**The marquee is CSS, not Motion.** Two identical copies translate by exactly one
copy width, so the loop is seamless with no JavaScript and no hydration step.
The second copy is `aria-hidden`, so a screen reader hears the list once.

Continuously moving content is the exact case `prefers-reduced-motion` exists
for, so under it the animation stops, the duplicate copy is removed, and the
single remaining list wraps to show all twenty-one marks at once. Hovering also
pauses the scroll, verified as zero drift over 1.2 seconds and resumption on
leave. **One residual gap worth recording:** WCAG 2.2.2 asks for a mechanism to
pause moving content, and hover serves pointer users only. Keyboard users get no
pause because the pills are not focusable. Reduced motion covers the users most
affected, but a visible pause control would be needed for a strict 2.2.2 pass.

**The code card types on mount**, at roughly forty characters a second so the
whole block lands in about five and a half seconds. Speed lives in two named
constants at the top of `TypedCode.tsx`. Untyped characters render with `invisible`
rather than being omitted, so the block holds its full size from first paint:
measured at 404px both at first paint and after the animation, meaning no layout
shift. The reduced-motion check lives in the effect rather than the render,
because branching markup on a media query is what desynchronised hydration in
feature 1; under reduced motion the first tick reveals everything. Data is
composed on the server and passed as tokens, so the content layer still does not
reach the client bundle.
