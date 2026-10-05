# Fix: Portrait in the About section

**Type:** Fix
**Status:** verified
**Branch:** none. Built in conversation rather than through `/fix`, on `main`, and
committed directly as `00ba26f`. This log was written afterwards, on 2026-10-06.

## The problem

The About section and `/about` were text only. A buyer with no reviews to read
had no face to put to the name. The supplied portrait was a 1254px square PNG at
2.1 MB, about forty times a project cover's source file.

## The fix

- **Asset.** `public/assets/mohamed-noor.webp`, resized to 800px and encoded as
  WebP at 56 KB. The box is never wider than 240px, so 800px covers a 3x screen.
  The PNG was later removed from `public/`, where everything deploys.
- **Content.** `profile.portrait` in `src/content/profile.ts`, alt text included,
  typed as `ImageAsset` (called `Portrait` until the hero showcase needed the same
  shape).
- **Primitive.** `ProfilePortrait` in `src/components/primitives/`: `next/image`,
  `max-w-60`, `sizes="240px"`, and a `loading` prop.
- **Home section.** The portrait takes the side column, and Location and
  Availability move under the bio as a two-column row. Stacked under the portrait
  beside a two-paragraph summary, the side column ran about 250px past the text.
  Below `lg` the portrait leads (`order-first`).
- **`/about`.** The portrait heads the side column above the details, which
  balances against the five-paragraph bio. A `contents` wrapper below `lg` lets it
  lead the stacked layout. Eager there, because stacked it sits just under the
  page header.

## Build steps

1. [x] Encode the portrait and add `profile.portrait`, with the test fixture
   updated for the new field.
2. [x] Add `ProfilePortrait` and place it in the home section and on `/about`.

## Verify

- `npx tsc --noEmit`, `npm run lint`, `npm test` and `npm run build` pass.
- In a browser at desktop and phone widths, in both themes: the home section's
  columns balance, the portrait leads on a phone, nothing overflows.

## Verification results (2026-10-06)

| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npm run lint` | Clean |
| `npm test` | 338 tests, all passing |
| Browser, 1280px and 390px, both themes | Balanced columns on desktop; portrait first on a phone; no horizontal overflow |
| LCP on a normal load | The hero paragraph. Next's LCP warning about the portrait appeared only when a script scrolled to the section before the load settled |
