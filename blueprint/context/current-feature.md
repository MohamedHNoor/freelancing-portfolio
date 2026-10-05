# Fix: Sync the blueprint with the 2026-10-06 changes

**Type:** Fix
**Status:** not started
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

The edits that close all of this were made in conversation and sit uncommitted
on `main`. `/implement` moves them onto the fix branch and checks each step's
done-when against that diff, rather than rewriting them.

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

1. [ ] **History logs.** Done when the six logs exist with `**Type:** Fix`, each
   names its commit and records its verification, and the fixes README no
   longer claims the folder is empty.
2. [ ] **Plans, overview, design reference, standards and budgets.** Done when
   the overview's `blueprint:source-hash` equals the hash of the plans computed
   under `/overview`'s contract, the overview is under 20,000 bytes, none of the
   changed docs contains an em dash, en dash or ellipsis character, and the
   budget table matches a fresh cold-cache measurement.
3. [ ] **Tailwind stops scanning the blueprint.** Done when the build passes, the
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
