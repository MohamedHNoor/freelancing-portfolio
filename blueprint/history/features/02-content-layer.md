# Feature: Content layer

**From build-plan:** feature 2

**Branch:** feature/content-layer

**Status:** verified

## Goal

Define the typed content contract every later feature reads, and seed it with
clearly flagged placeholder data so features 3 to 10 have something real to
render against.

This feature ships no UI of its own. Its output is types, data modules, lookup
helpers, and a build-time invariant check that turns a malformed content entry
into a failed build rather than a wrong page.

## In scope

- `src/types/content.ts`: `Profile`, `ProofPoint`, `Service`, `ProcessStep`,
  `SkillGroup`, `Skill`, `Role`, `Project`, `Metric`, `CaseStudySection`,
  `CaseStudyHeading`
- Seed modules under `src/content/`: profile, services, skills, experience,
  projects
- Placeholder cover images under `public/projects/`
- Lookup helpers and the invariant check, exported from `src/content/index.ts`
  as the single entry point consumers import
- Unit tests for those helpers and every invariant, in `tests/content/`
- Moving person-level facts out of `src/lib/site.ts` into `profile`, and
  repointing the header, footer, mobile sheet, and root metadata at it

## Out of scope

- Any section, card, page, or route that renders this content. Features 3 to 8.
- The project index filter UI and its behavior. Feature 6 owns how category and
  stack drive filtering; this feature only guarantees the fields exist.
- `notFound()` handling for an unknown project slug. Feature 7 owns the route;
  this feature only pins that the lookup returns `undefined` rather than throwing.
- Real profile copy, real projects, the CV file, and real social links. Every
  module ships seeded and flagged.
- The production honesty gate. Feature 12 owns blocking the deploy; this feature
  only exposes the helper it will assert on.
- Metadata beyond the existing title and description. Feature 10.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is
`disabled`. Implement the steps in order without stopping for approval after
each, then present one review packet. No checkpoint commits. `/complete` creates
the single feature commit.

## Build steps

- [x] 1. **Types.** Write `src/types/content.ts` with every shape under Data /
  contracts. No `any`. Arrays that consumers must not mutate are typed
  `readonly`.
  **Done when:** `npx tsc --noEmit` is clean and the file exports every named
  type listed in Data / contracts.

- [x] 2. **Profile and services.** Add `src/content/profile.ts` and
  `src/content/services.ts`, typed against step 1. Two services, slugs
  `figma-to-nextjs` and `saas-platforms`, `order` 1 and 2. Profile carries the
  dual-track headline with the Figma track first, an availability status, and
  proof points that each name their evidence.
  **Done when:** the build succeeds, and every `ProofPoint.evidence` is a
  non-empty string naming something checkable rather than a restatement of the
  number.

- [x] 3. **Skills and experience.** Add `src/content/skills.ts` and
  `src/content/experience.ts`. Skill groups carry usage context per technology
  and no proficiency value of any kind. Roles use `YYYY-MM` strings.
  **Done when:** the build succeeds, no percentage or rating field exists
  anywhere in the skills module, and every role's `start` matches
  `^\d{4}-(0[1-9]|1[0-2])$` with `end` either the same pattern or `"present"`.

- [x] 4. **Projects and cover images.** Add `src/content/projects.ts` with three
  seeded projects, all `isPlaceholder: true`: one `figma-to-nextjs` conversion
  and two `saas-platforms` (one healthcare, one fintech), so feature 6's filter
  has more than one category to work with. Create `public/projects/` and
  generate one 1200x750 PNG per project. Each `caseStudy` carries all four
  headings in the fixed order.
  **Done when:** the build succeeds, each `cover.src` resolves to a file that
  exists under `public/`, each cover is a PNG (not SVG, which `next/image`
  blocks by default) matching its declared `width` and `height`, and every
  project's `caseStudy` headings are exactly Problem, Approach, Architecture,
  Outcome in that order.

- [x] 5. **Helpers and invariants.** Add `src/content/index.ts` exporting the
  helpers in Data / contracts plus a module-scope `assertContentInvariants()`
  call, so a content error fails `npm run build` during static generation.
  **Done when:** `npm test` passes with `tests/content/index.test.ts` covering
  every helper and every invariant listed in Data / contracts; the build succeeds
  with valid content; and, demonstrated once and then reverted, introducing a
  duplicate project slug fails the build with a message naming the duplicate
  slug.

- [x] 6. **Point the chrome at the content layer.** Remove `SITE.name` from
  `src/lib/site.ts`. Update `src/app/layout.tsx`, `Header.tsx`, `Footer.tsx`,
  and `MobileNav.tsx` to read `profile.name`, and the footer paragraph to read
  `profile.shortBio`. `SITE` keeps `description` for the metadata default until
  feature 10 owns metadata properly; `NAV_ITEMS` is unchanged.
  **Done when:** `grep -r "SITE.name" src` returns nothing; the page title, the
  footer copyright, and the accessible name of the logo link in the header,
  footer, and mobile sheet all still read the name, verified in the browser;
  and the mobile sheet still exposes an accessible name.

- [x] 7. **Verification pass.** Confirm nothing in feature 1 regressed and the
  content layer holds.
  **Done when:** `npm test`, `npx tsc --noEmit`, `npm run lint`, and
  `npm run build` are clean; the build route table still shows `/` and `/icon.svg` as static; the
  page renders at 390 and 1440 with no console errors; and the theme toggle,
  skip link, and mobile sheet still behave as they did at the end of feature 1.

## Files / areas

Created:

- `src/types/content.ts`
- `src/content/profile.ts`, `services.ts`, `skills.ts`, `experience.ts`,
  `projects.ts`, `index.ts`
- `public/projects/` with one PNG per seeded project
- `tests/content/index.test.ts`

Modified:

- `src/lib/site.ts` - `SITE.name` removed
- `src/app/layout.tsx` - metadata title reads `profile.name`
- `src/components/layout/Header.tsx`, `Footer.tsx`, `MobileNav.tsx` - read
  `profile`

## Data / contracts

Shapes follow `project-overview.md` exactly, with the deviations noted below.
`Project` and `CaseStudySection` are locked shapes read by features 6, 7, and
10; this is the last feature that may change them.

**Deviations from the overview, both narrowing rather than widening:**

- `CaseStudySection.heading` is `CaseStudyHeading`, the union
  `"Problem" | "Approach" | "Architecture" | "Outcome"`, not a bare `string`.
  The overview already fixes the set and the order, so the union makes that a
  compile error instead of a review comment. Every project must carry all four
  exactly once, in that order.
- `Skill.icon` stays optional and is left **unset** in all seed data. It is a key
  into `src/components/icons/`, which currently holds only `Logo.tsx`. Feature 5
  adds the brand marks and the registry; seeding keys that resolve to nothing
  would be a dangling reference.

**Sentinel and ordering rules, pinned so later features cannot reinterpret them:**

| Rule | Value |
|---|---|
| Dates | `YYYY-MM` strings only, never `Date`, so there is no timezone drift |
| Ongoing role | `end: "present"` is the only sentinel |
| Project order | Array order in `projects.ts` is canonical; helpers preserve it |
| Featured order | Same relative order as the full list |
| Service order | Ascending by `order` |
| Role order | `start` descending, ties broken by array order, using a stable sort |
| Unsupplied link | Empty string means not supplied; see below |

**`profile.links` and the no-invention rule.** Real handles have not been
supplied. Inventing a GitHub or LinkedIn URL would ship a broken outbound link
on a site whose whole argument is that its claims check out. All four fields
stay required by the type and are seeded as `""`, with `""` defined as "not
supplied". `getProfileLinks()` returns only the non-empty entries so consumers
render nothing rather than a dead link, and feature 9 must use it rather than
reading `profile.links` directly.

**Cover images.** `next/image` blocks SVG by default unless `dangerouslyAllowSVG`
or `unoptimized` is set, per the Next.js image documentation. Covers are
therefore PNG, so feature 6 needs no image configuration change and no
per-render special case. `cover.alt` is `""` for the seeded placeholders,
because a plain gradient panel conveys nothing and the adjacent project title
already names it; an empty alt is the correct treatment for a decorative image.
Real screenshots must carry descriptive alt text.

**Helpers, exported from `src/content/index.ts` only.** Components import from
`@/content`, never from an individual module.

| Helper | Returns | Empty or missing case |
|---|---|---|
| `getProfile()` | `Profile` | Always present |
| `getProfileLinks()` | `{ key, href }[]` | `[]` when none supplied |
| `getServices()` | `readonly Service[]`, by `order` | Never empty |
| `getServiceBySlug(slug)` | `Service \| undefined` | `undefined`, never throws |
| `getSkillGroups()` | `readonly SkillGroup[]` | Array order |
| `getRoles()` | `readonly Role[]`, `start` descending | `[]` allowed |
| `getProjects()` | `readonly Project[]` | `[]` allowed |
| `getFeaturedProjects()` | `readonly Project[]` | `[]` allowed; feature 3 and 6 must handle it |
| `getProjectBySlug(slug)` | `Project \| undefined` | `undefined`, never throws, so feature 7 can call `notFound()` |
| `getProjectSlugs()` | `readonly string[]` | For `generateStaticParams` |
| `getAdjacentProjects(slug)` | `{ previous?: Project; next?: Project }` | Both absent at the ends; no wraparound |
| `getPlaceholderProjects()` | `readonly Project[]` | What feature 12's honesty gate asserts on |

**Build-time invariants.** `assertContentInvariants(content)` takes its input
rather than closing over the imported modules, so tests can feed it deliberately
broken content; `src/content/index.ts` calls it at module scope with the real
modules. It throws on violation. Because every route imports the
content layer during static generation, a violation fails `npm run build`. Each
message must name the offending record.

- Project slugs are unique and match `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Every `project.category` matches an existing service slug
- Every project's `caseStudy` headings are the four canonical headings, once
  each, in order
- Every `ProofPoint.evidence` and `Metric.evidence` is non-empty
- Every `role.start`, and `role.end` when not `"present"`, matches `YYYY-MM`
- Service `order` values are unique

Editorial emptiness is not an invariant. Zero featured projects is a valid state
that consuming features must handle; it is not a build failure.

**Immutability.** Every exported collection is `readonly` and the modules use
`satisfies` so literal types stay narrow without widening the annotation.

**Security.** No user input, no runtime data, no authenticated actor, no tenant
boundary. All content is authored in-repo and imported at build time, so there is
no untrusted text and no injection surface in this feature.

## Testing

`AGENTS.md` now declares `npm test` (Vitest), so `verification.logicTests`
(`when-configured`) gates this feature. The helpers are in-scope logic and must
ship passing tests in the same reviewable diff as step 5. Tests live in
`tests/`, mirroring the `src/` path, and import through the `@/` alias.

`tests/content/index.test.ts` must cover:

| Case | Expected |
|---|---|
| `getProjectBySlug` with a seeded slug | That project |
| `getProjectBySlug` with an unknown slug | `undefined`, and it must not throw |
| `getAdjacentProjects` in the middle | Both neighbours, matching array order |
| `getAdjacentProjects` at the first entry | No `previous`, and no wraparound to the last |
| `getAdjacentProjects` at the last entry | No `next`, and no wraparound to the first |
| `getAdjacentProjects` with an unknown slug | Both absent, no throw |
| `getRoles` | `start` descending, with an equal-`start` pair proving the tie-break is array order |
| `getServices` | Ascending by `order`, not array order, so seed them out of order |
| `getFeaturedProjects` | Only featured, in the same relative order as `getProjects` |
| `getProfileLinks` | Empty-string links omitted, supplied ones kept |
| `getPlaceholderProjects` | Every seeded project, while they are all flagged |
| Each invariant | `assertContentInvariants` throws on a violation, and the message names the offending record |

Two rules for these tests. Assert ordering against explicit expected sequences
rather than re-deriving the order with the same sort the helper uses, or the
test proves nothing. And drive the sort and tie-break cases from fixtures passed
into the helpers where the signature allows it, so the assertions do not silently
change meaning when the seed content is replaced with real work.

Sections, layout, and the chrome rewiring in step 6 are exempt and ride on
browser evidence, per the browser verification rule in the standards.

## Notes for the AI

- Seed content is fictional. Every project carries `isPlaceholder: true`, and
  nothing may imply a real client, employer, or engagement that did not happen.
  Placeholder case studies should read as plausible scope, not as claimed
  history.
- No prices, rates, or day rates anywhere. `typicalTimeline` is duration only.
- No proficiency percentages, star ratings, or skill levels. That was removed
  from the reference design deliberately.
- Do not invent URLs, employer names that suggest real companies, client names,
  or testimonials.
- Proof point evidence must name something a visitor could check, such as a
  Lighthouse run on a named route, not a restatement of the number.
- Content modules are data. Keep logic out of them; it belongs in `index.ts`.
- The MHN mark and `NAV_ITEMS` stay in their current homes. Only person-level
  facts move.

## Open questions

None blocks implementation; all are content that can be swapped without touching
a type.

- **Real profile content, links, and CV.** Seeded and flagged. The four
  `profile.links` fields ship as `""` until supplied. This is already recorded in
  the overview's open questions.
- **Availability status.** Seeded as `"available"`. Only you know the true value;
  it is a one-word edit in `profile.ts`.
- **Real projects.** Three placeholders ship. They must be replaced with work you
  can stand behind before feature 12 deploys, and self-initiated or spec work
  counts as long as the case study says so.

## What changed during implementation

Three things differ from the spec as written. All were forced by running the
checks rather than by preference.

1. **Step 5's build demonstration could not pass until step 6 was done.** With
   the content layer written but nothing importing it, a duplicate project slug
   built cleanly with exit code 0: the module was never loaded during static
   generation, so `assertContentInvariants` never ran. The invariant only became
   a real gate once step 6 pointed the chrome at `@/content`. Re-run after step
   6, the same duplicate fails the build with exit code 1 and the message
   `Content: duplicate project slug "example-studio-marketing-site"`.

   The consequence is worth carrying forward: **the invariant check only
   protects routes that actually import the content layer.** It is currently
   reached through the root layout, so every route inherits it, but a future
   route that avoids `@/content` would not be covered.

2. **`MobileNav` takes `name` as a prop instead of reading `@/content`.** It is
   a client component, so importing the content layer there would have bundled
   every case study into the browser just to label the sheet. `Header` reads the
   profile on the server and passes the one string down. Verified by grepping
   the built client chunks: no case study copy appears in any of them.

3. **The two services are seeded deliberately out of array order**, with
   `order: 2` listed first. Otherwise `getServices` would pass its ordering test
   on insertion order alone and prove nothing.
