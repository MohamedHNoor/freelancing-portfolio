# Feature: Site and dashboard separation

**From build-plan:** feature 15
**Status:** verified
**Branch:** feature/site-and-dashboard-separation

## Goal

Finish the isolation already started by the shipped `(site)` route group. The
root layout provides the shared document shell without marketing animation or
navigation dependencies. Public URLs, content, accessibility, static generation,
theme behavior and print layout remain intact while crawler rules and the CSP
prepare for the planned private and payment routes.

## In scope

- Remove `MotionProvider` and `SkipLink` from `src/app/layout.tsx`. Keep the
  document, shared fonts, theme initialization, metadata and body layout there.
- Have `SiteChrome` own the marketing `MotionProvider` and `SkipLink` around
  its existing header, focusable main landmark and footer. Both `(site)` and
  the root 404 already use it; preserve that reuse.
- Give the standalone resume a small server layout with its own `SkipLink`,
  without marketing chrome or Motion. Its page already owns `#main-content`.
- Disallow planned dashboard, auth, payment and API paths in `robots.txt`
  while retaining public crawling and the absolute sitemap URL.
- Allow the exact Stripe Checkout origin only in `form-action`, keeping the
  rest of the existing production and development CSP intact.
- Update directly affected architecture/standards descriptions and record fresh
  public-route transfer measurements using the method in AGENTS.md.

## Out of scope

Database, auth, dashboard/client portal screens, route handlers, payments,
checkout calls, dependencies, middleware/proxy, CI and browser-test harness setup.
No public route relocation is needed: `(site)`, `SiteChrome` and the standalone
resume already shipped. Do not change portfolio content or address unrelated
findings. Client access policy belongs to later auth/portal planning.

The approved `prototypes/overview.html`, `project.html`, `client.html`,
`create.html`, `pay.html` and `theme.css` remain references for later dashboard
UI. This feature consumes none of them and must not port their tokens or delete
the prototypes. Port relevant shared tokens before the first dashboard UI step.

## Build loop

Use the named feature branch. `stepReview: feature` means one review packet
after the small steps pass; checkpoint commits are disabled. `/complete` owns
the work-level commit and merge. This spec is for review before implementation.

## Build steps

1. [x] **Isolate public layout dependencies.** Remove the two wrappers from the
   root layout, add them once through `SiteChrome`, and add the resume layout's
   skip link. Adjust stale local comments. Done when all 11 public pages and
   an unmatched URL render with exactly one working skip link and one
   `#main-content`; marketing pages and the 404 retain their chrome, the resume
   retains its standalone and print layout, and marketing animation still
   honors reduced motion. Root/resume must not import Motion. Typecheck and
   build pass with public routes still static or SSG. Capture browser evidence
   for `/`, `/resume`, a case study, and a 404 in dark/light themes, mobile and
   desktop, including keyboard skip-link focus, navigation and console errors.
2. [x] **Prepare crawler and CSP rules.** Add a small pure robots-policy helper
   used by `src/app/robots.ts`, and update the existing security-header helper.
   Done when focused tests prove the exact disallow list, public allow rule,
   absolute sitemap URL and only the approved Stripe `form-action` expansion.
   The production policy still disallows eval; development differs only by its
   existing script-src eval allowance. No other CSP directive or header changes.
3. [x] **Verify runtime output and document boundaries.** Update targeted
   architecture and coding-standard passages for the new provider/skip-link
   ownership. Done when `/robots.txt`, `/sitemap.xml`, production headers and
   public routes match the contracts below; fresh production-browser transfer
   measurements for all 11 public routes satisfy existing ceilings and show no
   unexplained regression against AGENTS.md. Document existing served-cover
   overages without raising budgets. TypeScript, lint, tests and production
   build pass; obtain the required current passing independent-review receipt
   before the final implementation handoff.

## Files / areas

- `src/app/layout.tsx`, `src/components/layout/SiteChrome.tsx`
- `src/app/(site)/layout.tsx` and `src/app/not-found.tsx` (verify reuse; adjust
  only comments or integration if necessary)
- New `src/app/resume/layout.tsx`; existing `src/app/resume/page.tsx` landmark
- `src/app/robots.ts`, new `src/lib/robots.ts`, new `tests/lib/robots.test.ts`
- `src/lib/security-headers.ts`, `tests/lib/security-headers.test.ts`
- Targeted layout passages in `blueprint/dashboard-architecture.md` sections
  19 and 33, and `blueprint/context/coding-standards.md`
- AGENTS.md budget measurements only if fresh evidence warrants an update

## Data / contracts

- No data model, user input, persistence or authorization changes. Robots rules
  are crawler guidance, not access control; owner-scoped auth follows later.
- Root remains a Server Component with no request/session reads. Do not make
  the public route tree dynamic through `headers()`, `cookies()` or middleware.
- Marketing pages and root 404 get one `MotionProvider` and one `SkipLink`
  from `SiteChrome`. The resume gets one skip link from its own layout and no
  provider. Do not nest another main landmark or duplicate `main-content`.
- Future auth/dashboard/pay layouts must supply their own skip links and main
  landmarks; do not create those layouts or private routes in this feature.
- Robots: user agent `*`, `allow: "/"`, with disallow values `/dashboard`,
  `/pay/`, `/payment/`, `/login`, `/register`, `/forgot-password`,
  `/reset-password`, `/verify-email`, `/api/`. Prefix rules cover descendants;
  none excludes `/projects`, `/contact` or `/resume`.
- Robots keeps `absoluteUrl("/sitemap.xml")`; the sitemap remains the nine
  public base routes plus the two existing case studies. No private entries.
- CSP `form-action` becomes exactly `'self' https://checkout.stripe.com`.
  No wildcard, alternative Stripe origin, script-src, connect-src or frame-src
  expansion. Existing HSTS and other response headers remain intact.
- Keep `dynamicParams = false`, known static project slugs, metadata and social
  image paths unchanged. Unknown slugs and unknown URLs continue to render 404.
- Dark is default, saved light preference is applied before paint, and the
  resume stays printable without marketing chrome. Browser measurements use
  fresh contexts, 1280 x 800, no scrolling, network idle, and transferSize sums
  for navigation and resources, including preloads and automatic prefetches.

## Testing

- Shared robots helper: assert exact crawler policy and sitemap result with a
  deterministic origin. No network or browser needed for these logic tests.
- Extend existing CSP tests: exact form-action destination and unchanged other
  directives; production vs development parity except script-src eval.
- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`. There is no
  combined Verify command. Do not add one in this feature.
- No browser-test command exists. Use one-time live browser evidence rather
  than installing a harness or writing unit tests that mirror layout markup.
- Inspect public HTML, skip-link focus, theme, motion, 404 recovery, resume
  print and production headers. Check console and failed network requests.
- Re-measure all public routes against the recorded 255.4 KB marketing JS,
  225.6 KB resume JS, 109.5 KB fonts and 14.6 KB CSS baselines. Current home
  transfer is 598.0 KB against a 600 KB ceiling; investigate any overage before
  declaring success. Existing 13.6-16.1 KB card-cover overages are already
  recorded and are not caused by this change.
- Independent review is selected by `when-sensitive` because of the CSP
  destination expansion. Audit/Check/Try are manual in the regular workflow.
  Follow the configured automatic independent-review execution after explicit
  approval for its immutable checkpoint commit; do not waive or self-review it.

## Notes for the AI

Strict TypeScript; no `any`, new dependencies or Tailwind config. Preserve the
existing CSS-first design system and public content. Reuse the small layout
components rather than rebuilding the app shell. Keep the provider below the
root and give the resume only the accessibility primitive it needs.

The root 404 sometimes renders outside the site group: verify unknown project
slugs as well as unmatched URLs so provider/skip-link duplication is caught.
If Next's not-found boundary nests chrome in a reachable case, repair that
integration in step 1 rather than claiming the default URL proves both cases.

Do not start a dev server. When live production verification needs a server,
ask the user to run the production server. Use fresh browser evidence; builds
do not prove focus, visual parity, printing or transferred page weight.

The existing public implementation and latest completed fix provide the starting
baseline. Implementation and runtime verification are recorded below; the
independent-review gate remains pending before the final handoff.

## Implementation evidence

- Focused crawler/CSP checks: `npm test -- tests/lib/robots.test.ts tests/lib/security-headers.test.ts`, 28 tests passed.
- Layout and documentation changes are implemented. `npm test`: 16 files, 373 tests passed. `npm run lint`: passed. `npm run build`: passed, all public routes static or SSG. `npx tsc --noEmit --incremental false`: passed after the build regenerated route types for the new resume layout.
- Baseline browser capture: 20 route/theme/viewport combinations (home, resume, case study, unmatched URL and unknown project slug; dark/light; 1280px/390px). Each has exactly one working skip link and main landmark, no overflow or unexpected console/page errors. Resume print emulation keeps the name visible and toolbar hidden with system fonts.
- Post-change production browser checks passed on the restarted server. All 20 before/after screenshots are pixel-identical. The same theme/viewport matrix retains exactly one working skip link and main landmark, no overflow or unexpected console/page errors, and the resume print behavior. A separate fresh-context pass on all 11 public pages verifies keyboard focus and reports no console/page errors or failed requests.
- Client navigation from home to projects to a case study and back passed. Saved light preference survives reload; reduced-motion marquee duration is 0.00001 seconds with visible headings. Live robots output matches the exact disallow list, sitemap has exactly the 11 public URLs, and production CSP includes the approved Stripe form destination with the remaining security headers intact.
- Fresh production transfer measurements use the documented cold-context, 1280 x 800, network-idle, no-scroll method. Site JS is 254.2 KB, resume JS 224.4 KB, fonts 109.5 KB, CSS 14.6 KB. All unchanged ceilings pass except the previously documented served-cover overages (13.6-16.1 KB against 10 KB); these are unchanged. Home transfer is down from 598.0 KB to 596.7 KB. AGENTS.md records the fresh values without changing budgets.

| Public route | Total transferred KB |
|---|---:|
| `/` | 596.7 |
| `/about` | 444.8 |
| `/services` | 442.2 |
| `/process` | 438.6 |
| `/skills` | 476.6 |
| `/experience` | 438.1 |
| `/projects` | 468.9 |
| `/projects/travelgrid-africa` | 477.5 |
| `/projects/portfolio-site` | 485.2 |
| `/contact` | 437.0 |
| `/resume` | 390.8 |

- One-time browser evidence: `/tmp/feature15-after-browser.json`, `/tmp/feature15-all-routes.json`, `/tmp/feature15-navigation.json`, `/tmp/portfolio-budget-measurements.json`, `/tmp/feature15-after-*.png` and `/tmp/feature15-after-resume.pdf`. Scripts and captures are temporary verification artifacts; no runner, dependency or browser-test command was added.
- Implementation steps are verified. The configured independent review is pending explicit approval for its immutable checkpoint commit; a passing receipt is still required before the final implementation handoff.

## Findings

### 15/F-14 [P2] closed - /resume still describes the replaced three-track positioning in its search and social descriptions

**File:** src/app/resume/page.tsx:20
**Found:** 2026-10-05 by /audit (independent; scope: current; lens: quality)
**Why it matters:** The fix exists to replace the three narrow tracks, and its SEO
bullet calls for "the brief's titles and descriptions". `/resume`'s `description`
still reads "Experience, stack and selected work for a freelance software engineer
building white-label sites for agencies, SaaS products for startups, and Figma to
Next.js sites." `routeMetadata` copies it into Open Graph and Twitter, so the
prerendered `resume.html` carries the old positioning in its `description`,
`og:description` and `twitter:description` meta tags, and again in the embedded
page payload. The same file is in this delta (its
subtitle moved from the headline to `profile.role`), so the page was touched and
this line was missed. It is the snippet a search result or a LinkedIn share of the
resume shows, which is the start of the conversion path the fix is built around.
F-12 corrected the leftovers it named; this one was not among them. A sweep of the
built HTML finds no other instance: the remaining "white-label" on `/` is the
Agencies audience card, as the spec intends.
**Suggested fix:** Rewrite the description in the new positioning, for example
"Resume of Mohamed Noor, a full-stack web developer in Wellington, New Zealand:
experience, technology and selected work." No code change beyond the string.
**Resolution:** Fixed by `/fix` on `fix/resume-description-positioning`. The description now reads "Resume of Mohamed Noor, a full-stack web developer in Wellington, New Zealand, with work history, technology and selected projects on one printable page." The built `resume.html` carries it in `description`, `og:description` and `twitter:description`, and contains no "white-label" text.

**Re-reviewed 2026-10-05 by /audit (independent; current; quality, security, performance, tests; 6877c45..fca7c7d): closed.** The nearby resume page was inspected while reviewing its new layout. `src/app/resume/page.tsx:26-27` now describes a full-stack software engineer in Wellington with named technologies, experience, skills and projects. The obsolete three-track description is gone; `routeMetadata("/resume")` contains no old description override, and the unchanged root description also uses current positioning. This closes the original stale-positioning defect without claiming a new runtime metadata capture.


## Independent review

**Status:** passed
**Target commit:** fca7c7d5166733a2e19b4c6b5158ba6ccb329fd3
**Base commit:** 6877c456825267a7ffbd97e4037d4cccfdbcd18f
**Base ref:** main
**Spec hash:** 96d3b4ab3edb026a98337f0b78f99726932bc860ca8818a93feefdde34948bb2
**Prepared by:** codex
**Builder model:** unknown (runtime did not expose exact model)
**Requested reviewer:** codex
**Requested model:** gpt-6-astra
**Requested execution:** automatic
**Requested at:** 2026-10-05T18:03:28.326554Z
**Workflow:** regular
**Check required:** no

**Reviewer adapter:** codex
**Reviewer model:** gpt-6-astra
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-10-05T18:06:53.077213Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD`, `git merge-base main HEAD`, `shasum -a 256 blueprint/context/current-feature.md`, `git status --short`: passed; exact target, enforceable base, spec hash and source-tree freshness confirmed before and after review.
- `git diff --check main...HEAD`: passed.
- `npm test`: passed, 16 files and 373 tests.
- `npm run lint`: passed.
- `npx tsc --noEmit --incremental false`: passed.
- `npm run build`: unavailable in reviewer execution environment; both ordinary and escalated attempts exited 1 when Turbopack's PostCSS worker could not bind its internal local port (`Operation not permitted`). No source compilation diagnostic was produced. The spec records a prior successful production build of this unchanged checkpoint.
- Python comparison of all `/tmp/feature15-after-*.png` files with their corresponding before captures: passed, 20 of 20 byte-identical pairs.
- Targeted search of changed test files: no skipped, focused, todo or placeholder tests found.

## Evidence

- Reviewed the complete 13-file `6877c456825267a7ffbd97e4037d4cccfdbcd18f..fca7c7d5166733a2e19b4c6b5158ba6ccb329fd3` delta, excluding the request and findings from code scope. Inspected nearby `(site)` layout, MotionProvider, SkipLink, resume page, case-study static/404 handling, site URL and SEO helpers, sitemap, next.config.ts, and existing CSP tests. Generated output, dependencies and unrelated source were excluded from code review.
- Quality and accessibility: the root retains document/fonts/theme/metadata; SiteChrome supplies one Motion provider, skip link and focusable main; the standalone resume adds its own skip link without Motion. Existing server-component and static-route boundaries remain intact.
- Security: the only CSP value change is exact `form-action 'self' https://checkout.stripe.com`; production still excludes eval, development changes only its existing script-src allowance, and all other directives/headers remain unchanged. Robots policy matches every specified prefix and is explicitly crawler guidance, not authorization.
- Tests: pure policy tests pin the complete crawler contract and destination restriction. Existing tests cover production/development CSP parity and the absolute URL helper. No new data flow, action, authentication or payment execution is introduced.
- Inspected `/tmp/feature15-after-browser.json` and its capture script: 20 route/theme/viewport cases have one skip link, one main landmark, keyboard focus transfer, no overflow, no unexpected page/console errors, and resume print emulation checks. Manually viewed `/tmp/feature15-after-390-light-_resume.png`; all 20 before/after screenshot pairs are byte-identical.
- Inspected `/tmp/feature15-all-routes.json` and its script: all 11 public routes return 200 with single landmarks and working focus, with no reported console/page errors or failed requests. `/tmp/feature15-navigation.json` records client navigation, saved light theme, reduced motion, the exact robots policy and 11 sitemap URLs; both unknown-route and unknown-project-slug 404s are covered by the capture matrix.
- Inspected `/tmp/portfolio-budget-measurements.json`: all 11 totals match the spec; home is 596.7 KB, site JS 254.2 KB and resume JS 224.4 KB. Existing served-cover overages are explicitly preserved and no ceiling was raised. These are supplied production-browser captures, not measurements rerun by this reviewer.
- The fresh generic reviewer was invoked in Codex with selected model `gpt-6-astra` and no builder transcript. Request and completed identity/execution fields match.

## Findings

- No new findings in the complete current feature delta; no open or fixed P0/P1 findings.
- F-14 closed after reviewing the nearby resume metadata and SEO composition: the obsolete three-track positioning is absent. Other carried findings remain unchanged and were outside this feature's code scope.

## Remaining risk

- `npm run build` could not be independently completed because Turbopack's internal worker port is denied in this reviewer environment, including after an escalated retry. The failed attempts partially replaced ignored `.next` output; the builder has been notified to restore a successful build before further runtime verification or completion. This is an unavailable verification signal, not a diagnosed source defect; prior successful build and browser evidence remain recorded in the immutable spec.
- No repository Browser tests, Verify, dedicated security-scan or performance command is configured. No dependencies were installed and no network vulnerability scan was run. Browser behavior and transfer figures were reviewed from the supplied temporary evidence, not repeated live in this reviewer environment. Formal Check was not required.
- The existing 13.6–16.1 KB served project-cover sizes exceed the 10 KB ceiling; this predates the feature and the approved spec explicitly preserves/documented it. Home remains close to its 600 KB ceiling. Lighthouse was not rerun.

## Completion verification

- Final `npm run build`: passed; all 19 generated entries completed, public pages static or SSG. This final successful build resolves the earlier builder build-restoration blocker; the reviewer limitation above remains recorded verbatim.
- Final `npm test`: 16 files, 373 tests passed.
- Final `npm run lint` and `npx tsc --noEmit --incremental false`: passed.
- Reused current production-browser evidence for all 11 public routes, focus/navigation/theme/print behavior, 20 identical before/after captures and transfer budgets. No product, test, config or acceptance-criteria change occurred after the approved review checkpoint.
- Prototypes were not consumed and remain available for later dashboard UI.
