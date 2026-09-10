# Feature: Accessibility and performance pass

**From build-plan:** feature 12

**Branch:** feature/accessibility-and-performance-pass

**Status:** verified

## Goal

This site sells accessibility and performance as services. Every route now
exists, so this is the pass where the site is held to the claim it makes: a
keyboard and screen reader walk of every surface, axe clean in both themes,
motion that actually collapses, measured Lighthouse scores, and a written
bundle and image budget.

The pass ends by making the credibility strip honest. `src/content/profile.ts`
currently asserts "95+ Lighthouse performance", "WCAG 2.1 AA" and "100%
statically generated routes" with evidence strings describing measurements that
have never been run. Either the numbers this feature records replace them, or
the claims come off the site. A buyer who cross-checks a fabricated number is
the exact failure this project was built to avoid.

## In scope

- A contrast gate as real logic: WCAG AA checked over every declared token pair
  in both themes, run by `npm test`
- axe-core added as a devDependency and driven through Playwright MCP over every
  route in both themes, including the interactive states a static sweep misses
- Full keyboard operation: tab order, visible focus, skip link, mobile nav,
  theme toggle, project filter, contact form
- Screen reader semantics: landmarks, one `h1` per page, heading order,
  `aria-current`, and form errors wired to their inputs
- A reduced-motion pass over the four moving things: `Reveal`, `TypedCode`, the
  hero marquee, and the typing cursor
- Lighthouse measured at or above 95, and a recorded bundle and image budget
- Replacing every proof point in `src/content/profile.ts` with a measured value
  or removing it
- Correcting the stale "Feature 12 blocks the deploy" comments in
  `src/types/content.ts` and `src/content/projects.ts`

## Out of scope

- **The placeholder deploy gate.** The comments in `src/types/content.ts:112`
  and `src/content/projects.ts:5` say feature 12 blocks the deploy while any
  project has `isPlaceholder: true`; the overview's open questions say feature 13
  does. Feature 13 owns it, because a deploy gate belongs in Deployment
  readiness. This feature only fixes the comments so they stop pointing at the
  wrong owner.
- Vercel configuration, production environment variables, and the deploy.
  Feature 13.
- A `Browser tests` command or any test runner. `/browser-tests` owns that.
  axe-core arrives as a library this feature drives by hand, not as a harness.
- A `Verify` command and automatic GitHub checks. `/ci` owns those.
- Replacing placeholder content, real projects, real roles, or the CV file.
- Redesign. A contrast failure is fixed by adjusting the token that fails, not
  by restyling the component that uses it.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is
`disabled`. Implement every step in order without stopping for approval between
them and without committing along the way, then present one review packet.
`/complete` creates the single feature commit and merges after approval.

**This feature needs a running production server for most of its evidence.** Do
not start one. At the beginning of step 2, stop and ask the user to run
`npm run build && npm start`, and confirm it is up before driving the browser.
Step 6 additionally needs the user to run Lighthouse and report the numbers.

`npm test` must be green at the end of step 1 and at the end of the feature.
`npm run build` must be green before any measurement step.

## Build steps

- [x] 1. **Make contrast a test, not an opinion.** Add `src/lib/contrast.ts` with
  pure functions: `oklchToSrgb`, `relativeLuminance`, `contrastRatio`, and
  `parseThemeTokens(css)` returning the `:root` and `.dark` token maps. Add
  `tests/lib/contrast.test.ts` covering the maths against known values (black on
  white is 21:1, a colour against itself is 1:1) and then asserting every pair in
  the Data / contracts table against its threshold, parsed from the real
  `src/app/globals.css`. A token carrying an alpha component, such as
  `--border: oklch(1 0 0 / 12%)` in the dark theme, must be composited over its
  stated background before the ratio is computed; an uncomposited alpha value is
  a wrong answer, not an approximation. Fix any failing pair by adjusting the
  token in `globals.css`, never by restyling a component. **Done when** `npm test`
  is green with the new file, every pair in the table is asserted in both themes,
  and the review packet names any token whose value changed and by how much.

- [x] 2. **axe clean, in both themes, including the states.** Add `axe-core` as a
  devDependency. Ask the user to start the production server, then drive
  Playwright MCP over every surface in both light and dark: `/`, `/about`,
  `/services`, `/projects`, `/skills`, `/experience`, `/resume`, `/contact`, one
  case study, and a 404 from an unknown URL. A static sweep of a page at rest
  misses the states most likely to fail, so also sweep: the mobile navigation
  open, the contact form after a failed submit with its errors showing, the
  project filter on a combination that matches nothing, and the theme toggle in
  each position. Record the violation list before and after. **Done when** axe
  reports zero violations on every surface and state listed above in both themes,
  the before and after lists are in the review packet, and every fix is a code
  change rather than a suppression. Split this step if the violation list is
  large enough that one diff cannot be reviewed.

- [x] 3. **Keyboard operation, end to end.** With the same server, walk each route
  with the keyboard only. Confirm: the skip link is the first stop and moves
  focus to `#main-content`; tab order follows visual order; every interactive
  element has a visible focus ring that meets the 3:1 threshold from step 1; the
  mobile navigation traps focus while open, closes on Escape, and returns focus
  to the trigger; the theme toggle is operable and announces its state; the
  project filter is operable and its result count is reachable; the contact form
  submits and its errors are reachable. **Done when** every route is operable
  with no mouse, no focus trap exists outside the mobile navigation, no element
  is reachable but invisible, and the packet names each defect found and its fix.

- [x] 4. **Screen reader semantics.** Verify and repair: exactly one `h1` per
  route, no skipped heading levels, `header`/`nav`/`main`/`footer` landmarks
  present once each, `aria-current="page"` on the active navigation item, and the
  contact form's errors wired to their inputs with `aria-describedby` and
  `aria-invalid`. Decorative images and icons stay hidden from the accessibility
  tree; meaningful ones carry text. **Done when** the accessibility tree for each
  route, read through Playwright MCP, shows one `h1`, an unbroken heading order,
  and the four landmarks; the active navigation item exposes `aria-current`; and
  a submitted-invalid contact form exposes each error as the description of its
  own field.

- [x] 5. **Reduced motion actually collapses.** With `prefers-reduced-motion:
  reduce` emulated, confirm each moving thing settles into its final state rather
  than animating: `Reveal` (fades without translating, per `MotionConfig
  reducedMotion="user"`), `TypedCode` (reveals on the first tick), the hero
  marquee, and the `animate-pulse` cursor. The global CSS block at
  `src/app/globals.css:174` forces `animation-duration: 0.01ms` and
  `animation-iteration-count: 1`, which lands the 48s marquee instantly at
  `translateX(-50%)`; the row renders exactly two copies, so confirm the result is
  visually identical to the start rather than a half-scrolled row. **Done when**
  screenshots in the reduced-motion state show every surface at rest and correct,
  no element is left mid-transform, and nothing is missing that a full-motion
  visitor would see.

- [x] 6. **Measure, then write the budget down.** Ask the user to run Lighthouse
  against the production server for `/`, one case study, and `/contact` on the
  mobile preset, and to report performance, accessibility, best practices and SEO
  for each. Separately, measure with Playwright MCP the transferred JavaScript
  per route and the transferred weight of each project cover image. Record the
  results and add a **Budgets** subsection to the Commands section of `AGENTS.md`
  naming the measured baseline and the ceiling for each: per-route transferred
  JS, total page weight, and maximum source weight for a project cover. Note in
  that subsection that the Turbopack build output reports no size columns, so the
  measurement is the browser, not the build. **Done when** every reported
  Lighthouse category is at or above 95 on all three routes, the budget
  subsection exists in `AGENTS.md` with real numbers, and any route below 95 is
  either repaired within this feature's scope or recorded in the packet with the
  reason it cannot be.

- [x] 7. **Make the credibility strip true.** Replace each entry in
  `profile.proofPoints` with the value this feature actually measured and an
  evidence string describing the measurement that was run, or delete the entry.
  The three current entries claim a Lighthouse score, WCAG 2.1 AA conformance and
  100% static generation; the last is checkable from the build output, the first
  two now have real numbers behind them from steps 6 and 2. `assertContentInvariants`
  already refuses an empty `evidence`, so an entry cannot be softened into a
  claim with nothing behind it. In the same step, correct the stale comments in
  `src/types/content.ts` and `src/content/projects.ts` to name feature 13 as the
  owner of the placeholder deploy gate, and drop the "feature 11 runs the
  Lighthouse, axe, and Core Web Vitals passes" line in `src/content/profile.ts`,
  which names the wrong feature. **Done when** `npm test` and `npm run build` are
  green, every remaining proof point states a number this feature measured, and
  the packet lists each proof point as kept-with-new-value or removed.

## Files / areas

**New**

- `src/lib/contrast.ts` - oklch conversion, relative luminance, contrast ratio,
  token parsing
- `tests/lib/contrast.test.ts` - the maths and the real token pairs

**Changed, expected**

- `src/app/globals.css` - any token that fails its contrast threshold
- `src/content/profile.ts` - proof points, and the stale feature reference
- `src/types/content.ts`, `src/content/projects.ts` - placeholder gate ownership
- `AGENTS.md` - the new Budgets subsection
- `package.json` - `axe-core` devDependency

**Changed, as defects are found**

Any component under `src/components/` that fails an axe, keyboard, semantics or
reduced-motion check. The likely surfaces, from this pass's own reading, are
`MobileNav.tsx` (focus trap and Escape), `ThemeToggle.tsx` (state
announcement), `ProjectFilter.tsx` and `ProjectIndex.tsx` (result count and the
empty state), `ContactForm.tsx` (error wiring), `SkipLink.tsx`, and
`TypedCode.tsx` (the `invisible` spans are in the accessibility tree, so confirm
a screen reader is not read the untyped remainder).

**Untouched**

`src/lib/site.ts`, `src/lib/seo.ts`, `src/lib/structured-data.ts`, and the
metadata, sitemap and social image routes. Feature 11 shipped them verified;
nothing in this pass has a reason to change them.

## Data / contracts

**Contrast pairs and thresholds.** WCAG 2.1 AA: 4.5:1 for body text, 3:1 for
large text and for non-text UI boundaries. Asserted in both `:root` and `.dark`:

| Pair | Threshold | Why |
|---|---|---|
| `foreground` on `background` | 4.5 | body text |
| `foreground` on `card` | 4.5 | text on raised surfaces |
| `card-foreground` on `card` | 4.5 | card body text |
| `muted-foreground` on `background` | 4.5 | every lead and secondary line |
| `muted-foreground` on `card` | 4.5 | secondary text in cards |
| `brand` on `background` | 4.5 | eyebrows and accent labels |
| `brand` on `card` | 4.5 | accent labels in cards |
| `primary-foreground` on `primary` | 4.5 | filled buttons |
| `secondary-foreground` on `secondary` | 4.5 | badges |
| `accent-foreground` on `accent` | 4.5 | accent surfaces |
| `destructive` on `background` | 4.5 | form error text |
| `ring` on `background` | 3 | the focus indicator |
| `border` on `background` | 3 | card and input boundaries |
| `input` on `background` | 3 | field boundaries |

A token whose value carries alpha is composited over the stated background
first. If a pair in this table names a token that does not exist in
`globals.css`, drop that row and say so in the packet rather than inventing a
token to satisfy it.

**Budgets.** No numbers exist yet; step 6 sets them from measurement. Observed
today, for the baseline: three project covers at 53-57KB each, and
`.next/static` holding 19 JavaScript chunks totalling 1.3MB on disk, the largest
224KB. Disk size is not transferred size, which is why the budget is measured in
the browser.

**Proof points.** `ProofPoint` is `{ value, label, evidence }` and
`assertContentInvariants` throws on an empty `evidence`. The rule this step
enforces is narrower than the type: `evidence` must describe a measurement that
was actually run during this feature.

## Testing

The test gate is on. Step 1 is the only step that adds logic, and it ships
`tests/lib/contrast.test.ts` in the same diff. Every other step is UI and
runtime behaviour, which the standards exempt from unit tests and which rides on
Playwright MCP evidence and the build instead.

axe-core is a devDependency used to drive an in-browser audit by hand. It is not
wired into `npm test`, does not become part of any Verify command, and adds no
runner. Wiring it into an automated gate is `/browser-tests` and `/ci` work.

## Notes for the AI

- Evidence is the product of this feature. A step that says "checked" without a
  screenshot, an accessibility tree, an axe result or a reported number has not
  met its done-when.
- Fix causes, not symptoms. An axe violation is repaired in the markup or the
  token; `aria-hidden` on a failing element and a suppression list are both ways
  of making the report lie.
- The site must keep working in both themes at every step. Dark is the default
  and light is supported; a contrast fix that only holds in one is not a fix.
- `MotionConfig reducedMotion="user"` already handles Motion globally, and the
  CSS block handles CSS animation globally. Expect the reduced-motion step to be
  verification rather than repair, and treat a needed change there as a real
  finding worth explaining.
- `TypedCode` renders untyped characters as `invisible` spans to hold layout.
  They are still text in the accessibility tree, so check what a screen reader
  actually reads on the hero before assuming it is fine.
- Do not touch feature 11's metadata, sitemap, social image or structured data
  code. If an axe or Lighthouse finding appears to implicate them, record it and
  raise it rather than editing them inside this pass.
- Lighthouse and the browser sweeps need the production server, not `npm run
  dev`: dev builds carry unminified bundles and dev-only overlays, and a score
  from one is not a score.

## Open questions

- **What happens if a route lands below 95.** The gate is a build gate by the
  overview's own framing, so the intent is to fix rather than to lower the bar.
  This does not block starting: steps 1 to 5 run regardless, and step 6 records
  what it finds. If a shortfall traces to something this feature owns, such as
  JavaScript weight, image weight, font loading or layout shift, repair it here.
  If it traces to hosting, third-party requests, or anything feature 13 owns,
  record it in the packet with the reason and hand it forward rather than
  widening this feature.
- **What replaces a proof point that measurement does not support.** If the
  measured Lighthouse score is below the "95+" the strip currently claims, the
  entry states the measured number or comes off. Which of those two, for which
  entry, is the user's call at step 7 and needs the real numbers in hand. Raise
  it with the measurements rather than deciding silently.
