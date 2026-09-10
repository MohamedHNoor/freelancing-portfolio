# Freelance Portfolio

A personal portfolio site for a freelance developer, focused on two kinds of work:
Figma to Next.js website builds, and healthcare or fintech SaaS platform
engineering. Projects are presented as case studies (problem, approach, stack,
outcome) rather than screenshots.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4,
shadcn/ui, and Motion.

## Commands

```bash
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm test           # vitest, single run
npm run preflight  # production build with the deploy gate on
npm run lint       # eslint
npx tsc --noEmit   # typecheck
```

`npm run preflight` is expected to fail while any project is still seeded. See
[Deploying](#deploying).

## Content

All site content lives in typed modules under `src/content/`. Editing the site's
text, projects, skills, and experience does not require touching components.

## Environment

Copy `.env.example` to `.env` and fill in the values. The contact form needs a
Resend API key and a verified sender domain to deliver mail in production. Every
variable is documented in the table under [Deploying](#deploying).

## Deploying

Nothing here deploys anything. This is the runbook for the person who does.

### Vercel settings

Import the repository and take the defaults. The framework preset is detected as
Next.js, the build command is `npm run build`, and the install command is
`npm install`.

- **No `vercel.json` is needed**, and none exists. A standard Next.js App Router
  project needs no routing, rewrite, or function configuration, and this one has
  no database, storage, workers, or cron jobs. Do not add one speculatively.
- **No Node version is pinned** in `engines`. Vercel tracks a supported LTS on
  its own, and a pin invented here could fail a build on a version this project
  has never been tested against.
- Security response headers come from `next.config.ts`, which Vercel translates
  into its own routing config. They are not configured in the dashboard.

### Environment variables

Set all four in the Vercel project before the first production build.

| Variable | Needed | What breaks without it |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | build time | The production build fails, naming the variable. |
| `RESEND_API_KEY` | request time | Contact fails closed: the visitor sees the direct email address instead. |
| `CONTACT_TO_EMAIL` | request time | Same. |
| `CONTACT_FROM_EMAIL` | request time | Same. |

`NEXT_PUBLIC_SITE_URL` must be the final origin, scheme and host only, with no
path, query string, or trailing slash. **Set it before the first production
build, not after.** Canonical URLs, the sitemap, and both social images are baked
at build time, so changing it later requires a rebuild to take effect.

The three Resend variables are read only when the contact Server Action runs
(`src/actions/contact.ts`). A deploy missing them degrades rather than breaking:
the form fails closed, logs no variable name, and shows the mailto fallback.

### The deploy gate

`src/lib/deploy-readiness.ts` refuses a production build while any project in
`src/content/projects.ts` carries `isPlaceholder: true`. Since feature 14 replaced
the seeded projects with real work, **no project carries the flag and
`npm run preflight` exits 0.** The guard stays because the next project added has
to clear the same bar: `project-plan.md` states that no project may ship to
production with the flag set.

Preview deploys are not gated, so the site can be reviewed on Vercel before its
content is real. Run `npm run preflight` locally to get the same answer.

### Smoke tests, after a deploy

Cheapest first.

1. Every URL in `/sitemap.xml` returns 200.
2. `/sitemap.xml` lists ten URLs, all on the production origin: eight static
   routes plus one per project.
3. `/robots.txt` names that sitemap at the same origin.
4. `/opengraph-image` renders, and so does one case study's image.
5. View source on `/`: the canonical points at the production origin, not
   localhost or a `vercel.app` preview host.
6. Response headers on any route include `Content-Security-Policy`,
   `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`,
   `X-Frame-Options`, and `Permissions-Policy`.
7. The browser console is free of CSP violations on `/`, a case study, and
   `/contact`.
8. The theme toggle works and a reload does not flash the wrong theme. This is
   the check that catches a CSP blocking the pre-paint script.
9. Submit the contact form for real and confirm the mail arrives.
10. The mailto fallback on `/contact` opens a mail client.
11. An unknown URL renders the 404 page.
12. `/resume` prints correctly, and its CV download either resolves or is absent.
13. Re-run Lighthouse mobile and compare against the numbers recorded in
    [AGENTS.md](AGENTS.md). Two routes measured below 95 locally for reasons
    recorded there; production has Brotli and a CDN, so expect better.

### Checks nothing can automate

The deploy gate covers projects only. These are still seeded and carry no
mechanical guard:

- the roles in `src/content/experience.ts`
- the usage context on all thirty entries in `src/content/skills.ts`
- the proof points in `src/content/profile.ts`, which must keep matching what was
  actually measured

Read them before launch.

## Working on this project

Agent instructions live in [AGENTS.md](AGENTS.md).
