# Fix: MHN logo, favicon and share-card mark

**Type:** Fix
**Status:** verified
**Branch:** none. Built in conversation rather than through `/fix`, on `main`, and
committed directly as `00ba26f`. This log was written afterwards, on 2026-10-06.

## The problem

The header, footer and mobile menu drew the original split-M mark, an inline SVG
in two tones from `--logo-from` and `--logo-to`. The favicon was the same M, and
the share card painted a letter M on a violet-to-blue tile. A new MHN identity
arrived as an SVG package: primary, flat and monochrome logos and a compact
favicon mark, each for light and dark surfaces.

A raster logo was tried first and dropped. Its "transparent" PNG had the
checkerboard painted into the pixels, and its blue and cyan palette did not
match the site's violet tokens.

## The fix

- **Assets** in `public/assets/`: `mhn-primary-light.svg` and
  `mhn-primary-dark.svg` (the logo), `mhn-favicon-dark.svg` (the share card) and
  `mhn-favicon-light.svg` (the source of the favicon's light half). The flat and
  monochrome variants were removed as unused; the package's originals stay
  outside the repository.
- **Logo** (`src/components/icons/Logo.tsx`). Both primary variants render
  through `next/image`, which serves SVG as-is, toggled by `dark:hidden` and
  `hidden dark:block`. The theme is a class set by the pre-paint script, not
  `prefers-color-scheme`, so `<picture>` could not choose. As `<img>`, the two
  files' identical gradient ids cannot collide. 114 x 40, eager in the header.
- **Favicon** (`src/app/icon.svg`). Both favicon marks in one file, switched by an
  internal `prefers-color-scheme` rule, which is what a browser's tab strip
  follows. A `media` attribute on separate icon links is not reliably honoured.
- **Share card** (`src/components/og/OgCard.tsx`, `src/lib/og.ts`). The mark is
  `mhn-favicon-dark.svg`, read by `loadMark()` as a data URI because satori
  cannot resolve a site-relative path; both social image routes pass it in. The
  top rule moves to the logo's violet and lilac, `#9b7bff` to `#d6b5ff`.
- **Tokens.** `--logo-from` and `--logo-to` removed from `globals.css`; nothing
  else read them.

Not done, and not new: there is no `favicon.ico` or Apple touch icon, which
Safari and iOS rely on.

## Build steps

1. [x] Add the SVGs and render the logo per theme in the header, footer and
   mobile menu.
2. [x] Combine the favicon marks into `src/app/icon.svg`.
3. [x] Put the favicon mark and the new colours on the share card.

## Verify

- `npx tsc --noEmit`, `npm run lint`, `npm test` and `npm run build` pass.
- The header shows the matching variant in each theme, the favicon follows the
  OS colour scheme, and both social image routes render the new mark.

## Verification results (2026-10-06)

| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` | Clean; 338 tests passing; every route static |
| Header, both themes | The matching variant at 114 x 40, no console warnings |
| `icon.svg`, both OS colour schemes | Dark tile in dark, light tile in light |
| `/opengraph-image` and a case study card | The new mark and rule render through satori |
