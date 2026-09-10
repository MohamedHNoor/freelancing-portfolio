# Feature: SEO and social sharing

**From build-plan:** feature 11

**Branch:** feature/seo-and-social-sharing

**Status:** verified

## Goal

Make every route of this site describable by a machine and shareable as a link
that looks deliberate. A proposal, a LinkedIn post, or a GitHub profile link is
how cold traffic arrives, so the unfurled card is often the first thing a buyer
sees, before any of the work it points at. Today every route emits a title and a
description and nothing else: no canonical, no absolute origin, no social image,
no sitemap, no robots file, no structured data.

## Design reference

No new reference image. The social card is derived from the site's own identity,
which already exists in the repository:

- Dark-theme tokens in `src/app/globals.css` (`.dark` block): `--background`,
  `--foreground`, `--brand`, `--border`
- The split-M logo mark in `src/app/icon.svg`, which already carries its two
  halves as literal hex (`#a78eff`, `#53a3f2`)
- `design/website-ui-design.png` for the overall feel: near-black layered
  surfaces, violet accent, confident and technical

The card is dark only. It is an image, not a themed page, and the site's default
and primary identity is dark.

## In scope

- One resolved site origin from `NEXT_PUBLIC_SITE_URL`, with a documented format
  and a fail-closed production build
- `metadataBase`, a title template, and Open Graph and Twitter defaults on the
  root layout
- A canonical URL and a matching `og:url` on every route, including `/` and each
  case study
- `robots.txt` and `sitemap.xml` as Next metadata routes, covering every static
  route and every project slug
- A generated 1200x630 Open Graph image for the site, and one per case study
- `Person` structured data on `/`, and `BreadcrumbList` plus `CreativeWork`
  structured data on case studies, with the placeholder honesty rule applied
- `noindex` on the 404 page
- Focused Vitest coverage for the origin resolver, the sitemap builder, and the
  structured-data builders

## Out of scope

- Lighthouse, axe, reduced-motion, and Core Web Vitals passes. Feature 12 owns
  those, and owns replacing the proof-point numbers in `src/content/profile.ts`
  with what those passes actually recorded
- Vercel project configuration, production environment variables, and the deploy
  itself. Feature 13 owns those
- The honesty gate that blocks a deploy while any project has
  `isPlaceholder: true`. Feature 12 owns it. This feature must not silently
  half-implement it by hiding placeholder projects from the sitemap
- Analytics, verification meta tags for search consoles, RSS, `hreflang`, or
  multiple locales. None are in the plans
- Choosing the custom domain. See Open questions
- A browser test harness. None is configured, and this feature is not the place
  to add one

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is
`disabled`. Implement every step in order without stopping for approval between
them and without committing along the way, then present one review packet
covering the whole feature. `/complete` creates the single feature commit and
merges after approval.

Run `npm test` at the end of every step that touches logic, and `npm run build`
at the end of every step that touches a route or metadata. Both must be green
before the review packet.

## Build steps

- [x] 1. **Resolve the site origin, fail closed.** Extend `src/lib/site.ts` with a
  pure `resolveSiteUrl(raw, options)` plus a `SITE_URL` constant and an
  `absoluteUrl(path)` helper. Read the raw value as the static member expression
  `process.env.NEXT_PUBLIC_SITE_URL`, never a computed lookup, so Next inlines it
  at build time. Accepted format: an `http:` or `https:` origin with no path
  beyond `/`, no query, and no hash; the resolved value is normalized with any
  trailing slash removed. A missing, blank, or malformed value throws an error
  naming `NEXT_PUBLIC_SITE_URL` when `process.env.NODE_ENV === "production"`, and
  falls back to `http://localhost:3000` otherwise, so `npm run dev` and `npm test`
  work with no env file. Replace the stale "Feature 10 owns metadata properly and
  may replace this" comment on `SITE`. Tighten the `.env.example` comment to state
  the accepted format. **Done when** `npm test` is green with new cases in
  `tests/lib/site.test.ts` covering a good value, a trailing slash, a blank value
  in each of the two modes, a `ftp:` scheme, a value carrying a path, and a value
  carrying a query, and `npm run build` still succeeds against the
  already-populated local `.env`.

- [x] 2. **Root Open Graph and Twitter defaults.** In `src/app/layout.tsx` add
  `metadataBase: new URL(SITE_URL)`, an `openGraph` block (`type: "website"`,
  `siteName`, `title`, `description`), and `twitter: { card: "summary_large_image" }`.
  Do **not** add `alternates` here: an inherited canonical would point every route
  that has not yet declared its own at the home page, and a missing canonical is a
  safer failure than a wrong one. Omit `og:locale`; no locale has been chosen.
  All copy comes from `getProfile()` and `SITE`, never inline strings.
  **Done when** `npm run build` succeeds with no `metadataBase` warning in the
  output, and the built HTML for `/` carries `og:type`, `og:site_name`,
  `og:title`, `og:description`, and `twitter:card`.

- [x] 3. **Per-route canonicals and one title rule.** Add `src/lib/seo.ts` with
  `ROUTE_PATHS`, the canonical list of the eight static routes (`/`, `/about`,
  `/services`, `/projects`, `/skills`, `/experience`, `/resume`, `/contact`), and
  `routeMetadata(path)` returning `{ alternates: { canonical: path }, openGraph: { url: path } }`
  so a route can never set one without the other. In `src/app/layout.tsx` change
  `title` to `{ default, template }` with the template `"%s - <name>"`. In the same
  step, trim every page title to its bare page name, because the template and the
  existing suffixed titles cannot both be correct at once: `About`, `Services`,
  `Projects`, `Stack`, `Experience`, `Resume`, `Contact`, `Page not found`, and
  the case study's `project.title`. Spread `routeMetadata()` into every page's
  metadata, give `src/app/page.tsx` its own metadata export carrying only
  `routeMetadata("/")`, and set `openGraph.type: "article"` plus
  `routeMetadata(\`/projects/${slug}\`)` in the case study's `generateMetadata`.
  Add `robots: { index: false, follow: false }` to `src/app/not-found.tsx`. Delete
  the now-untrue "Feature 10 owns canonicals, social images, structured data and
  the sitemap entry" comments in `src/app/projects/page.tsx`,
  `src/app/resume/page.tsx`, and `src/app/projects/[slug]/page.tsx`.
  **Done when** `npm run build` succeeds and the built HTML shows: `/about` titled
  `About - <name>` with `<link rel="canonical">` and `og:url` both absolute and
  ending `/about`; `/` canonical at the bare origin; a case study canonical at its
  own slug; and the 404 carrying `noindex`. Confirm in the same pass that
  `og:title` and `og:description` are present and route-specific on at least
  `/about` and one case study; if Next has not derived them from `title` and
  `description`, set them explicitly in `routeMetadata`'s callers before the step
  is done.

- [x] 4. **robots.txt and sitemap.xml.** Add `buildSitemapEntries(origin, routes, slugs)`
  to `src/lib/seo.ts`: absolute URLs only, static routes in `ROUTE_PATHS` order
  followed by case studies in `getProjectSlugs()` order, no duplicates, and no
  doubled slashes. Emit `url` only. `lastModified` is deliberately omitted rather
  than stamped with build time, which would claim every route changed on every
  deploy; `changeFrequency` and `priority` are omitted because nothing here
  measures either. Add a guard that throws when a `NAV_ITEMS` route is missing
  from `ROUTE_PATHS`, in the style of `assertContentInvariants`, so a future
  navigation item cannot quietly fall out of the sitemap. Add `src/app/sitemap.ts`
  and `src/app/robots.ts` as thin adapters; robots allows all user agents,
  disallows nothing, and points at `absoluteUrl("/sitemap.xml")`. All three
  current projects are listed regardless of `isPlaceholder`, because the deploy
  gate is feature 12's and a sitemap that silently drops them would hide the
  problem rather than block it. **Done when** `npm test` is green with
  `tests/lib/seo.test.ts` covering the eleven expected URLs, absoluteness,
  ordering, dedup, the no-doubled-slash case for an origin passed with a trailing
  slash, and the missing-nav-route guard; and `npm run build` lists `/sitemap.xml`
  and `/robots.txt` as prerendered static routes, with the served `/sitemap.xml`
  carrying exactly those eleven URLs and `/robots.txt` naming the sitemap.

- [x] 5. **The site social card.** Add the Space Grotesk Bold (700) TTF under
  `src/assets/fonts/` together with its SIL OFL 1.1 license file, and read it with
  `readFile(join(process.cwd(), ...))` at module scope, per the Next 16
  `opengraph-image` convention. `next/font` cannot be used inside `ImageResponse`,
  and fetching the face from a CDN would put a network call on the critical path
  of every build. Add `src/app/opengraph-image.tsx` exporting `alt`,
  `size` (1200x630), `contentType` (`image/png`), and a default `ImageResponse`.
  It inherits down the tree, so it is the card for every route that does not
  override it. Content comes from the content layer, never inline copy:
  `getProfile().name`, `getProfile().headline`, both `getServices()` names, and the
  site host from `SITE_URL`. satori resolves neither `oklch()`, CSS custom
  properties, nor Tailwind v4 theme tokens, so every colour is a hex or rgb
  literal in an inline `style`; derive them from the `.dark` block in
  `src/app/globals.css` and record the token each one came from in a comment. The
  logo mark's two halves are already literal hex in `src/app/icon.svg`. `alt` must
  describe the card, not repeat the page title. **Done when** `npm run build`
  succeeds, the build output shows the image route prerendered, `/` serves an
  `og:image` at an absolute URL under the site origin with `og:image:width` 1200
  and `og:image:height` 630, and the generated PNG has been opened and looks like
  this site rather than a default sans-serif box.

- [x] 6. **Case study social cards.** Add
  `src/app/projects/[slug]/opengraph-image.tsx` carrying the project title, the
  resolved service name from `getServiceBySlug(project.category)`, and the first
  metric's value and label when `project.metrics` is non-empty. When
  `project.isPlaceholder` is true the card must carry the same `Example project`
  marker the page already shows in `CaseStudyHeader`, so a shared link cannot
  present seeded work as client work while the page it opens says otherwise.
  Handle the empty-metrics case without a blank region. Reuse the font and colour
  approach from step 5 rather than duplicating the values. **Done when**
  `npm run build` prerenders one image per project slug in the route table; if it
  does not, export `generateStaticParams` from the image file as well and confirm
  again. Each case study's built HTML must reference its own image, the three
  generated PNGs must each have been opened, and the two placeholder cards must
  show the marker.

- [x] 7. **Structured data.** Add `src/lib/structured-data.ts` with
  `serializeJsonLd(value)` returning `JSON.stringify(value).replace(/</g, "\\u003c")`,
  which is the escaping the Next docs require, plus `buildPersonJsonLd`,
  `buildCreativeWorkJsonLd`, and `buildBreadcrumbJsonLd`. Every builder takes its
  content as parameters rather than importing it, matching
  `assertContentInvariants`, so the failure cases are testable against fixtures.
  Render each as `<script type="application/ld+json" dangerouslySetInnerHTML>`;
  the Metadata API has no field for JSON-LD. `Person` on `src/app/page.tsx`:
  name, `url` at the origin, `description` from `shortBio`, `knowsAbout` from the
  two service names, `sameAs` built from `getProfileLinks()` through
  `toContactLink` so an unsupplied link is absent rather than empty, and `email`
  as the `mailto:` form already published on `/contact` and `/resume`.
  `BreadcrumbList` on every case study (`Home`, `Projects`, the project title).
  `CreativeWork` on a case study **only when `isPlaceholder` is false**: schema.org
  has no vocabulary a consumer respects for "this example is fictional", and
  emitting it anyway would make a machine-readable claim the page itself
  contradicts in prose. The breadcrumb is emitted either way, because the
  navigation path is true regardless. **Done when** `npm test` is green with
  `tests/lib/structured-data.test.ts` covering the `<` escaping, absolute URLs,
  `sameAs` omitting an unsupplied link, `CreativeWork` returning nothing for a
  placeholder fixture and a full object for a real one, and the breadcrumb order;
  `npm run build` is green; and the built HTML for `/` and one case study each
  parse as valid JSON when the script contents are read back.

## Files / areas

**New**

- `src/lib/seo.ts` - `ROUTE_PATHS`, `routeMetadata`, `buildSitemapEntries`
- `src/lib/structured-data.ts` - JSON-LD builders and `serializeJsonLd`
- `src/app/sitemap.ts`, `src/app/robots.ts`
- `src/app/opengraph-image.tsx`
- `src/app/projects/[slug]/opengraph-image.tsx`
- `src/assets/fonts/` - Space Grotesk Bold TTF and its OFL license
- `tests/lib/site.test.ts`, `tests/lib/seo.test.ts`, `tests/lib/structured-data.test.ts`

Added during implementation, to keep the two cards and the one script sink from
being written twice:

- `src/lib/og.ts` - card size, the converted palette, and the font loader
- `src/components/og/OgCard.tsx` - the shared card frame both images render into
- `src/components/seo/JsonLd.tsx` - the only `dangerouslySetInnerHTML` for
  structured data, so `serializeJsonLd` cannot be bypassed by a caller
- `src/assets/fonts/README.md` - why the font file is committed

**Changed**

- `src/lib/site.ts` - origin resolution, `absoluteUrl`, stale comment removed
- `src/app/layout.tsx` - `metadataBase`, title template, Open Graph and Twitter defaults
- `src/app/page.tsx` - own metadata export, `Person` JSON-LD
- `src/app/about|services|projects|skills|experience|resume|contact/page.tsx` - trimmed titles, `routeMetadata()`
- `src/app/projects/[slug]/page.tsx` - trimmed title, `routeMetadata()`, `og:type`, JSON-LD
- `src/app/not-found.tsx` - trimmed title, `noindex`
- `.env.example` - the accepted `NEXT_PUBLIC_SITE_URL` format

**Untouched**

`src/content/` and `src/types/content.ts`. `Project` and `CaseStudySection` are
locked shapes; this feature reads them and must not change them.

## Data / contracts

**`NEXT_PUBLIC_SITE_URL`** - already declared in `.env.example`, already set in
the local `.env`, already named in both plans. An `http:` or `https:` origin, no
path beyond `/`, no query, no hash, no trailing slash after normalization. Public
by design: it is inlined into the client bundle and appears in every canonical
tag. Never put a secret behind this name. Missing or malformed fails the
production build with an error naming the variable; outside production it falls
back to `http://localhost:3000`.

**Canonical and `og:url`** - always the same absolute URL for a given route,
produced by one helper so the two cannot drift.

**Sitemap** - eleven entries today: eight static routes plus one per project
slug. `url` only.

**Social images** - 1200x630 PNG, one site card plus one per case study. `alt` is
required and must describe the card.

**JSON-LD** - `Person` on `/`; `BreadcrumbList` on every case study;
`CreativeWork` only on a case study whose project is not a placeholder. All
serialized through `serializeJsonLd`, which escapes `<`.

## Testing

The test gate is on. Steps 1, 4, and 7 add in-scope logic and each ships its
tests in the same diff:

- `tests/lib/site.test.ts` - `resolveSiteUrl` and `absoluteUrl`
- `tests/lib/seo.test.ts` - `routeMetadata`, `buildSitemapEntries`, the nav guard
- `tests/lib/structured-data.test.ts` - all three builders and the escaping

Steps 2, 3, 5, and 6 are metadata, route, and image output. Per the standards
these are exempt from unit tests and ride on `npm run build` plus the built HTML
and the generated PNGs, inspected with the dev server and browser screenshots. No
`Browser tests` command is configured and this feature does not add one.

## Notes for the AI

- Ordering matters in step 3. The title template and the trimmed page titles are
  one atomic change; shipping the template alone renders `About - Name - Name`.
- Do not put `alternates` on the root layout. Inherited canonicals are the
  classic way a site canonicalizes half its pages to the home page.
- satori is not a browser. No `oklch()`, no CSS variables, no Tailwind v4 tokens,
  no `gap` shorthand surprises; every element that contains more than one child
  needs an explicit `display: flex`.
- Read `process.env.NEXT_PUBLIC_SITE_URL` as a literal static member expression.
  A destructured or computed read is not inlined and resolves to `undefined` in
  the browser bundle.
- All card and JSON-LD copy comes from the content layer. No inline strings that
  duplicate what `src/content/` already owns.
- The security-relevant surface here is small but real: JSON-LD is the one place
  this feature injects repository-authored strings into a `<script>` element, so
  `serializeJsonLd` is not optional and is tested directly.
- The proof-point numbers in `src/content/profile.ts` are still unmeasured
  placeholders. Do not surface them on a social card; feature 12 replaces them
  with measured values.
- Verify was never configured for this project, so there is no single umbrella
  command. `npm test` and `npm run build` are the gates. `/ci` is still due
  before feature 13.

## Open questions

- **The custom domain is still undecided.** `blueprint/project-plan.md` and the
  overview both flag this, and `NEXT_PUBLIC_SITE_URL` must match the final origin
  or every canonical, sitemap entry, and social image URL resolves to the wrong
  host. This does **not** block implementation: what this feature builds is the
  mechanism, the variable is already set locally, and the fallback covers
  development. It does block the deploy, which is feature 13's gate. Decide the
  domain before then and set the variable in the Vercel project.
