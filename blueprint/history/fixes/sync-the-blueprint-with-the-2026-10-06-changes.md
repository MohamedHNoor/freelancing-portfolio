# Fix: Sync the blueprint with the 2026-10-06 changes

**Type:** Fix
**Status:** verified
**Branch:** fix/sync-the-blueprint-with-the-2026-10-06-changes

## The problem

Six changes reached `main` on 2026-10-06 in `00ba26f` and `2b3ed29` without going
through `/fix` and `/complete`: the About portrait, the MHN logo and favicon, the
hero project showcase, the "Your Business" highlight, the recruiter resume (with
the `(site)` route group), and the canonical Tailwind classes. The blueprint did
not follow:

- **No history.** None of the six has a log in `blueprint/history/fixes/`, and
  that folder's README still says it is empty.
- **Plans state things that are no longer true.** `project-plan.md` describes a
  code-editor motif in the hero and a `specialisms` profile field, has no
  `resume` content module, and lists client components without the marquee
  pause control or the resume print button. `build-plan.md` treats feature 15's
  route group as unbuilt.
- **The overview is stale.** Its source hash no longer matches the plans, it
  still leads with the retired agency and startup SaaS positioning, and its data
  model lists `ProofPoint`, old service slugs and old contact project types.
- **The design reference and standards lag.** `dashboard-architecture.md` §19
  and §33 describe the route group as planned, with `/resume` inside it.
  `coding-standards.md` says "Motion only" and has nothing on the route group,
  print fonts, resume content rules or image assets.
- **Budgets are out of date.** `AGENTS.md` records page weights measured before
  the hero changed, a served-cover figure of 2.4 KB that does not match what
  ships, and says nothing above the fold animates in.
- **The docs leak into the stylesheet.** Tailwind scans the whole repository, so
  class names quoted in `blueprint/` compile into dead rules in the shipped CSS.

The synchronization edits were committed on `main` in `0c74be5` before this
spec was verified. `/implement` checks those existing edits on the fix branch
rather than rewriting them. The approved dashboard prototypes are separate work
and remain unchanged by this fix.

## The fix

- **History.** One log per change in `blueprint/history/fixes/`, each marked as
  written afterwards, naming its commit, and carrying the verification evidence
  gathered at the time. Drop the README's "Empty" line.
- **Plans.** Factual corrections only, in the plans' own voice: the hero
  showcase, the highlighted phrase, the resume module and its rule that it may
  only name technologies `skills` has evidence for, the client-component list,
  and feature 15's remaining scope (robots, the CSP, and where `MotionProvider`
  and `SkipLink` live).
- **Overview.** Regenerate from the plans under `/overview`'s rules: the data
  model checked against `src/types/content.ts`, under 20,000 bytes, and a fresh
  checkbox-normalized source hash.
- **Design reference and standards.** The shipped route tree and its three
  deviations in `dashboard-architecture.md`; the route group, client islands,
  CSS keyframe entrances, print fonts, resume content rules and image assets in
  `coding-standards.md`.
- **Budgets.** Re-measure every public route with the documented method and
  record it, including the served covers exceeding their 10 KB ceiling and the
  hero showcase as a new, unbudgeted asset.
- **Stylesheet.** `@source not "../../blueprint"` in `src/app/globals.css`.

Must not break: the build, every public route static, the test suite including
the contrast test that parses `globals.css`, and how the site looks. A CSS rule
may only disappear if no file in `src/` uses its class. No em dashes, en dashes
or ellipsis characters in the changed docs.

## Build steps

1. [x] **History logs.** Done when the six logs exist with `**Type:** Fix`, each
   names its commit and records its verification, and the fixes README no
   longer claims the folder is empty.
2. [x] **Plans, overview, design reference, standards and budgets.** Done when
   the overview's `blueprint:source-hash` equals the hash of the plans computed
   under `/overview`'s contract, the overview is under 20,000 bytes, none of the
   changed docs contains an em dash, en dash or ellipsis character, and the
   budget table matches a fresh cold-cache measurement.
3. [x] **Tailwind stops scanning the blueprint.** Done when the build passes, the
   compiled CSS contains none of the doc-only selectors, every selector removed
   relative to the pre-change build is unused in `src/`, and `npm test`,
   `npm run lint` and `npx tsc --noEmit` pass.

## Verify

- `npx tsc --noEmit`, `npm run lint`, `npm test` and `npm run build` pass, with
  every public route static.
- Recompute the overview hash and compare it with the marker.
- Diff the compiled CSS selectors against the build before step 3, and confirm
  each removed one has no match in `src/`.
- Read the six logs against the commits they name.

## Implementation verification (2026-10-06)

- Existing synchronization changes: `0c74be5`; the working tree was clean at
  implementation start. Work branch: `fix/sync-the-blueprint-with-the-2026-10-06-changes`.
- Step 1 passed: all six history logs name their source commit, identify their
  retrospective origin, and carry verification results. The fixes index has no
  empty-folder claim.
- Overview fingerprint matches the checkbox-normalized plan bytes:
  `699cfe682cbdef4bfef9bc0a66b4317b72c52363b84427c527fc96c83b941d88`.
  Overview size: 19,939 bytes, below 20,000.
- All Markdown files changed by `0c74be5` pass the punctuation rule.
- `npx tsc --noEmit --incremental false`: passed. `npm run lint`: passed.
  `npm test`: 15 files and 370 tests passed.
- A paired compilation through the installed Tailwind PostCSS plugin, using the
  same current source tree with and without the Blueprint exclusion, removes
  20 individual selectors. None occurs in source string/template class tokens;
  comments were excluded from this check. The canonical hover and reduced-motion
  mask selectors remain. Compiled text decreased from 75,090 to 73,848 characters.
- Step 2 passed on resume: the user-started production server was available on
  port 3000. All 11 public pages returned 200 in fresh isolated Chromium contexts
  at 1280 x 800 without scrolling, measured at network idle. AGENTS.md now
  records 392.1-598.0 KB total and explains included preloads and route prefetches.
  The home page has about 2 KB remaining under its 600 KB ceiling.
  The served-cover overage remains documented; no budget was raised.
- Step 3 passed: `npm run build` completed outside the sandbox after the sandboxed
  attempt stalled. All public pages are static or SSG; all 20 removed doc-only
  selectors are absent from `.next/static` CSS. Canonical hover and reduced-motion
  mask classes remain. `git diff --check` passed.
- Final review: this spec and the factual budget section in AGENTS.md changed
  in the current implementation diff.
  The product/docs corrections already exist in `0c74be5`; prototypes are untouched.
  No P0/P1 findings and no active independent-review request were found.
  This factual documentation synchronization does not select the sensitive-work
  independent-review gate. Audit, Check and Try are configured manual.

## Fresh browser measurements (2026-10-06)

One fresh browser context per route; Chromium headless, viewport 1280 x 800,
no scrolling, navigation plus resource transferSize summed after network idle.
KB = bytes / 1024. Preloaded images and automatic route prefetches are included.
The production server returns static prerender headers and the production CSP.

| Route | Total KB | JS KB | Result |
|---|---|---|---|
| `/` | 598.0 | 255.4 | HTTP 200 |
| `/about` | 445.9 | 255.4 | HTTP 200 |
| `/services` | 443.6 | 255.4 | HTTP 200 |
| `/process` | 440.0 | 255.4 | HTTP 200 |
| `/skills` | 478.0 | 255.4 | HTTP 200 |
| `/experience` | 439.5 | 255.4 | HTTP 200 |
| `/projects` | 470.3 | 255.4 | HTTP 200 |
| `/projects/travelgrid-africa` | 478.8 | 255.4 | HTTP 200 |
| `/projects/portfolio-site` | 486.6 | 255.4 | HTTP 200 |
| `/contact` | 438.3 | 255.4 | HTTP 200 |
| `/resume` | 392.1 | 225.6 | HTTP 200 |

- Fonts: 109.5 KB on every route. CSS: 14.6 KB on every route.
- Card covers: 13.6 and 16.1 KB at 640px, exceeding the existing 10 KB ceiling.
- Case-study covers: 31.5 and 40.9 KB at 1200px.
- Hero showcase: 66.7 KB at 1080px. Desktop home screenshot inspected.
- Two measurement passes agree exactly on route totals. The second pass included
  preloaded images in image categorization; all-resource totals were unchanged.
- Mobile and Lighthouse were not re-measured in this fix; prior values are
  historical evidence, not new claims.

Final automated gate after the budget update: TypeScript, lint, 370 tests and
production build passed. All public routes remain static or SSG. The final diff
contains AGENTS.md budget corrections and this verified spec only.
