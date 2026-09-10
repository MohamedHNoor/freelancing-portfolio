# Feature: Deployment readiness

**From build-plan:** feature 13

**Branch:** feature/deployment-readiness

**Status:** verified

## Goal

Make this repository safe and boring to deploy, and stop short of deploying it.

Two things stand between the site and production. The first is mechanical: every
project in `src/content/projects.ts` still carries `isPlaceholder: true`, and
`project-plan.md` §4 states the contract plainly - "No project may ship to
production with it set." Nothing currently enforces that. The second is
procedural: the Vercel settings, the four environment variables, and what to
check once it is live exist only in the plans, so a deploy today is done from
memory.

This feature builds the enforcement, writes the runbook, and leaves the deploy
itself to a separate, explicit yes.

## In scope

- A production deploy gate that fails the build while any project is still
  seeded, scoped so local builds and Vercel previews are unaffected
- An `npm run preflight` command that answers "would this deploy?" locally,
  using the same gate rather than a second implementation
- The Vercel settings this project needs, recorded where a person deploying will
  look
- The four environment variables, what each does, and which are required at
  build versus at request time
- A post-deploy smoke test list covering the routes, the metadata feature 11
  shipped, the contact path, and the human content checks nothing can automate
- Security response headers, including a Content Security Policy, served from
  `next.config.ts` so they apply without middleware
- Focused Vitest coverage for the readiness logic and the header set

## Out of scope

- **The deploy itself.** The overview is explicit: "Deployment is explicit and
  separately approved. Nothing is pushed or deployed without a direct yes." This
  feature ends at readiness. It does not push, does not connect a Vercel project,
  and does not change any remote setting.
- Buying or configuring the domain, DNS records, and verifying the Resend sender
  domain. Those are account actions outside this repository.
- Replacing placeholder projects, roles, or skill context with real content, and
  supplying the CV file. This feature builds the gate that blocks on the first of
  those; it does not write the content.
- **A nonce-based strict `script-src`.** Requested and considered, then rejected
  on evidence: Next's documented nonce approach requires middleware, and
  middleware makes every route dynamic, which breaks the overview's contract that
  all routes are statically generated. The built page carries three inline
  scripts of Next's own (`self.__next_f` flight data) whose contents change every
  build, so hashes are not maintainable either. Step 4 records the trade-off it
  takes instead.
- A `Verify` command and automatic GitHub checks. `/ci` owns those and is still
  unrun.
- Re-measuring Lighthouse against the deployment. That is a smoke-list item for
  the human deploying, and feature 12 recorded why the local numbers sit where
  they do.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is
`disabled`. Implement all steps in order without stopping for approval between
them and without committing along the way, then present one review packet.
`/complete` creates the single feature commit and merges after approval.

`npm test` and `npm run build` must both be green before the review packet. No
dev server is needed: everything here is verified from build output and tests.

## Build steps

- [x] 1. **The readiness rule, as testable logic.** Add
  `src/lib/deploy-readiness.ts` with `isProductionDeploy(env)` returning true
  only for `env.VERCEL_ENV === "production"`, and
  `findDeployBlockers({ projects })` returning a list of `{ id, message }` for
  every condition that must stop a production deploy. Today that is exactly one
  condition: any project with `isPlaceholder: true`, named in the message so the
  error says which. Take projects and env as parameters rather than importing
  them, so both are testable against fixtures; `assertContentInvariants` in
  `src/content/index.ts` takes its input the same way and for the same reason.
  Do not add checks the plans do not state: the overview records that nothing
  mechanically guards the roles or the skill context, and inventing a guard for
  them here would block a deploy on a rule nobody agreed. **Done when**
  `npm test` is green with `tests/lib/deploy-readiness.test.ts` covering: a
  production env, a preview env, a missing env, a local env, a project set with
  no placeholders, one placeholder, several placeholders, and an empty project
  list.

- [x] 2. **Wire the gate, and prove it fires both ways.** Call the rule at module
  scope in `src/content/index.ts`, beside the existing
  `assertContentInvariants(...)` call, so a production build throws before any
  route renders. The error must name every offending slug and say plainly that
  seeded projects cannot ship. Preview deploys must not be gated: a preview of
  seeded content is the normal way to look at this site before launch, so the
  check applies to `production` only. Add
  `"preflight": "VERCEL_ENV=production next build"` to `package.json` scripts, so
  the local answer to "would this deploy?" runs the real gate instead of a second
  copy of it, and record in `AGENTS.md` Commands that `npm run preflight` is
  **expected to fail today** and why, so a red result is not mistaken for a
  broken build. **Done when** `npm run build` still succeeds untouched,
  `npm test` is green, and `npm run preflight` exits non-zero naming all three
  example slugs. Then confirm the inverse rather than assuming it: temporarily
  flip one project's `isPlaceholder` to `false`, re-run `npm run preflight`, see
  the error name only the remaining two, and revert the edit before finishing the
  step.

- [x] 3. **The runbook.** Add a `## Deploying` section to `README.md`, which
  already carries Commands, Content and Environment sections and is where a
  person deploying will look. It must record:
  - Vercel settings: framework preset Next.js (auto-detected), the default build
    and install commands, and the fact that **no `vercel.json` is needed**. Say
    that explicitly with the reason, so the next person does not add one
    speculatively. Do not pin a Node version in `engines`: Vercel tracks a
    supported LTS on its own, and a pin invented here could fail a build for a
    version this project has never been tested against.
  - The four environment variables in one table with, for each: what it does,
    whether it is needed at build time or request time, and what breaks without
    it. `NEXT_PUBLIC_SITE_URL` is build-time and already fails the production
    build when missing or malformed (feature 11, `src/lib/site.ts`). The three
    Resend variables are request-time only; `src/actions/contact.ts:148` fails
    closed without them, logging no variable name and showing the visitor the
    direct email address instead, so a misconfigured deploy degrades rather than
    breaking.
  - The domain step: set `NEXT_PUBLIC_SITE_URL` to the final origin **before**
    the first production build, because canonicals, the sitemap and both social
    images are baked at build time and a later change requires a rebuild.
  - A smoke test list, ordered so the cheapest checks come first: every route in
    the sitemap returns 200; `/sitemap.xml` lists eleven URLs on the real origin;
    `/robots.txt` names that sitemap; `/opengraph-image` and one case study image
    render; the `/` canonical points at the production origin; a real contact
    submission arrives; the mailto fallback works; the 404 page renders for an
    unknown URL; `/resume` prints correctly and its download link resolves or is
    absent; and Lighthouse mobile is re-run and compared against the numbers
    feature 12 recorded in `AGENTS.md`.
  - The human content checks nothing can automate, drawn from the overview's open
    questions: the roles in `experience.ts` and the usage context on all thirty
    skills are still seeded and carry no mechanical guard.
  **Done when** `README.md` contains that section, every command and file path in
  it is correct against this repository, and the environment table matches the
  four names in `.env.example`.

- [x] 4. **Security headers, with the trade-off written down.** Add an async
  `headers()` to `next.config.ts` returning one header set for all paths, built
  from a `SECURITY_HEADERS` constant in a new `src/lib/security-headers.ts` so
  the list is testable rather than buried in config. Serve:
  `Content-Security-Policy`, `Strict-Transport-Security`
  (`max-age=63072000; includeSubDomains; preload`), `X-Content-Type-Options`
  (`nosniff`), `Referrer-Policy` (`strict-origin-when-cross-origin`),
  `X-Frame-Options` (`DENY`), and a `Permissions-Policy` denying camera,
  microphone and geolocation, none of which this site uses.

  The policy: `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`,
  `frame-ancestors 'none'`, `form-action 'self'`, `img-src 'self' data: blob:`,
  `font-src 'self'`, `connect-src 'self'`, `upgrade-insecure-requests`, and
  `'unsafe-inline'` on both `script-src` and `style-src`.

  Those last two are the honest part and must be explained in a comment, not
  quietly allowed. `script-src` needs it because the built page carries three
  inline scripts: Next's flight data, and the pre-paint theme script that exists
  precisely so a stored light preference never flashes dark. `style-src` needs it
  because two elements carry `style` attributes, including the marquee's
  pause state. The result is defence in depth rather than XSS immunity: it still
  blocks clickjacking, base-tag injection, form hijacking, plugin content and
  off-origin fetches, and this site renders no user-submitted HTML - its one
  script sink, JSON-LD, is escaped and directly tested. Say that in the comment
  rather than implying the policy is stricter than it is.

  **Done when** `npm test` covers the header set (every required name present,
  the CSP parses into directives, no directive is empty, and `script-src`/
  `style-src` carry `'unsafe-inline'` deliberately rather than by accident);
  `npm run build` is green; and against a running production server every route
  returns all six headers, and the browser console shows **zero CSP violations**
  on `/`, a case study and `/contact` in both themes, with the theme toggle
  still working and no flash of the wrong theme on reload.

## Files / areas

**New**

- `src/lib/deploy-readiness.ts` - `isProductionDeploy`, `findDeployBlockers`
- `src/lib/security-headers.ts` - `SECURITY_HEADERS`, `CONTENT_SECURITY_POLICY`
- `tests/lib/deploy-readiness.test.ts`, `tests/lib/security-headers.test.ts`

**Changed**

- `src/content/index.ts` - the gate call at module scope
- `package.json` - the `preflight` script
- `AGENTS.md` - `preflight` in Commands, with the note that it fails today
- `README.md` - the `## Deploying` section, including the headers
- `next.config.ts` - the `headers()` entry

**Untouched**

`src/content/projects.ts`
(step 2's flip is temporary and reverted), and everything feature 11 and 12
shipped.

## Data / contracts

**`VERCEL_ENV`** - a Vercel system environment variable, `production`,
`preview`, or `development`. The gate treats only the exact string `production`
as a production deploy; anything else, including unset, is not gated. This is
documented Vercel behaviour rather than something this repository can prove, so
step 2 verifies the logic locally by setting the variable by hand, and the smoke
list is where it is confirmed for real.

**Deploy blocker** - `{ id: string; message: string }`. `id` is stable and
machine-readable (`placeholder-projects`); `message` is the human sentence the
build error prints. A future blocker is a new entry, not a change to this shape.

**The four environment variables**

| Name | Needed | Missing behaviour |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | build time | production build fails, naming the variable |
| `RESEND_API_KEY` | request time | contact fails closed, mailto fallback shown |
| `CONTACT_TO_EMAIL` | request time | same |
| `CONTACT_FROM_EMAIL` | request time | same |

## Testing

The test gate is on. Steps 1 and 4 add logic and ship
`tests/lib/deploy-readiness.test.ts` and `tests/lib/security-headers.test.ts` in
the same diff. Step 2 is wiring, verified
by running the real command in both directions. Step 3 is documentation, verified
by reading it against the repository.

Step 4 does need browser evidence, unlike the rest of this feature: a CSP fails
silently in the response and loudly in the console, and the one thing it could
break - the pre-paint theme script - shows up as a flash rather than an error.
Ask the user to start a production server for it. No `Browser tests` command
exists and this feature does not add one.

## Notes for the AI

- The gate must fail the build, not warn. The plans state the contract as an
  absolute, and feature 12 already established that this project treats its own
  standards as build gates rather than goals.
- Scope the check to `production` precisely. Gating previews would remove the
  only convenient way to review this site before its content is real, which is a
  worse outcome than the one being prevented.
- `npm run preflight` failing is the correct result today. Every message about it,
  in `AGENTS.md` and in the review packet, must say so plainly, or the next
  person will treat a working gate as a broken build.
- Do not add a second readiness implementation for the script. One rule, called
  from the content layer, exercised locally through the real build.
- Do not invent Vercel configuration. A standard Next.js App Router project needs
  none, and this one has no database, storage, workers or cron jobs to configure.
- Revert the temporary `isPlaceholder` flip in step 2 before the step is checked.
  Leaving it would ship a seeded project marked as real, which is the exact
  failure this feature exists to prevent.

## Open questions

None of these block implementation. All three block the deploy that follows it,
and the runbook in step 3 is where they are recorded for the person doing it.

- **Is the domain final?** `.env` sets `NEXT_PUBLIC_SITE_URL` to
  `https://www.mohamedhnoor.com`, and every canonical, sitemap entry and social
  image in the current build is baked against it. Both plans still list the
  domain as undecided. If that value is right, the plans should be corrected; if
  it is not, the value must change before the first production build, not after.
- **Is the Resend sender domain verified?** Contact email does not work in
  production until it is, and DNS propagation is the slow part. The site degrades
  rather than breaking, so this gates working enquiries rather than the deploy.
- **When do real projects replace the seeded three?** The gate this feature builds
  will refuse a production build until they do. That is intended, and it means
  feature 13 finishing does not mean the site can go live.
