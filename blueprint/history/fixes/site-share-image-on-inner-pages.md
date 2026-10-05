# Fix: Site share image on inner pages

**Type:** Fix
**Status:** verified
**Branch:** fix/site-share-image-on-inner-pages

## The problem

A link to any inner page shared on LinkedIn, Slack or X shows no picture. In
the build, only four pages carry `og:image` and `twitter:image`: `/`, the 404
page and the two case studies. `/services`, `/projects`, `/process`, `/about`,
`/skills`, `/experience`, `/resume` and `/contact` carry neither.

The cause is how Next.js merges metadata. A page that sets `openGraph` replaces
the layout's object wholesale, including the images the root
`src/app/opengraph-image.tsx` file contributes. Every inner page sets
`openGraph` through `routeMetadata` in `src/lib/seo.ts` (for `og:url`, type and
site name), so each one drops the site card.

The pages that keep a card do so by accident:

- `/` keeps it because the image file sits in the same segment as the page, so
  it is applied after the page's own metadata.
- The 404 page keeps it because it sets no `openGraph`.
- The case studies have their own `opengraph-image`.

The comment in `src/app/opengraph-image.tsx` says the card "is the image for
every route that does not declare its own", which is not what ships.

## The fix

Follow the Next.js documented pattern for sharing a nested field: put the site
card in one shared object and spread it into each page's `openGraph`.
`routeMetadata` is already that shared helper for every route, so it attaches
the card:

- **Shared card object.** `url: "/opengraph-image"` resolves against
  `metadataBase`, like `og:url` already does. `width` and `height` come from
  `OG_SIZE` and `type` from `OG_CONTENT_TYPE`.
- **Alt text in one place.** The text moves out of
  `src/app/opengraph-image.tsx` into a shared constant, and the image file
  exports that constant, so the file and the metadata cannot describe the card
  differently.
- **`twitter:image`.** No separate change. Next copies Open Graph images into
  Twitter metadata when the page sets none, which is why `/` already has it.
- **Comment.** Correct the comment in `src/app/opengraph-image.tsx` to say
  `routeMetadata` attaches the card to every route.

Known trade-off: the shared URL has no content hash. Next adds one to its own
file-based image URL, so after the card design changes, a platform may show its
cached copy on inner pages until its cache expires. LinkedIn's Post Inspector
can force a refresh.

It must not break:

- `/` keeps exactly one `og:image`, the site card.
- Each case study keeps exactly one `og:image`, its own card.

Found while building: an explicit image in a page's `openGraph` does not sit
alongside a segment's own image file, it replaces it. Both case studies showed
the site card, and `/` lost its hashed file URL. `routeMetadata` therefore takes
an `ownImage` option, passed by `/` and the case studies, which leaves the
`images` key out entirely. Setting it to `undefined` would block the file too.
- Canonicals, `og:url`, `og:type`, `og:site_name`, titles and descriptions are
  unchanged.
- Every route stays static, and `/opengraph-image` stays a static route.
- No hand-written `<head>` tags: metadata API only.

## Build steps

1. [x] **Attach the site card in `routeMetadata`.** Add the shared card object and
   alt constant, include the card in `routeMetadata`'s `openGraph`, re-export
   the alt from the root image file, and correct its comment. Add a test in
   `tests/lib/seo.test.ts` asserting that `routeMetadata` carries the card's
   URL, size, type and a non-empty alt. Done when the test passes and the built
   HTML for every route in `ROUTE_PATHS` has exactly one `og:image` and one
   `twitter:image`. The inner pages and `/` point at `/opengraph-image`, and
   each case study points at its own card.

## Verify

- `npx tsc --noEmit`, `npm run lint`, `npm test` and `npm run build` pass, with
  every public route still static.
- For each built route under `.next/server/app/`, count `og:image` and
  `twitter:image` tags: 1 and 1 on all eleven pages.
- Optional, after deploy: paste `https://www.mohamedhnoor.com/services` into
  LinkedIn's Post Inspector and check that the card appears.

## Verification results (2026-10-05)

| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npm run lint` | Clean |
| `npm test` | 338 tests in 15 files, all passing (two new in `tests/lib/seo.test.ts`) |
| `npm run build` | Every public route static; `/opengraph-image` prerendered |
| Built HTML, 12 pages | One `og:image` and one `twitter:image` on each, with `og:image:alt`; the 8 inner pages use `/opengraph-image`; `/` and the 404 keep the hashed file URL; each case study keeps its own card |
| Other meta tags | Titles, descriptions, canonicals, `og:url`, `og:type` and `og:site_name` identical to `main` on all 12 pages (144 lines diffed) |
