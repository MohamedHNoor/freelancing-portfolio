# Fix: Project showcase in the hero

**Type:** Fix
**Status:** verified
**Branch:** none. Built in conversation rather than through `/fix`, on `main`, and
committed directly as `2b3ed29`. This log was written afterwards, on 2026-10-06.

## The problem

The hero's right column was a typing code-editor card (`HeroCodeCard`,
`TypedCode`). It said "this person can code" rather than "this person delivers
products", and it repeated the stack line beside it. It was briefly replaced by a
headshot, then, to a written brief, by a supplied render of devices showing
TravelGrid Africa, a laundromat mobile app and the North City Islamic Youth
Centre website.

The render was a whole hero mock-up. It also painted a copy of the real hero's
text down its left side and a service strip along its bottom, neither of which
could appear beside the real HTML.

## The fix

- **Asset.** `public/assets/hero-showcase.webp`: the full-colour original (a
  1690 x 931 PNG at 1.8 MB, kept outside the repository) re-encoded as WebP at
  138 KB and left uncropped.
- **Crop in CSS** (`src/components/sections/HeroShowcase.tsx`). The image is
  scaled and offset inside a box with the crop window's aspect ratio. The window,
  in source pixels: y 0 to 805, which drops the strip; x 608 to 1690 from `lg`
  and 608 to 1420 below it. x 608 is the narrowest gap between the painted text,
  which ends at 600, and the phone, which starts at 617. The component comment
  carries the arithmetic.
- **Themes.** Dark: no surface, the edges masked (top 12%, left 7%, bottom 15%,
  right 10% below `lg`) so the render's background melts into the page, and from
  `lg` it runs off the viewport's right edge. Light: a `bg-card` surface with a
  border and shadow, kept inside the page.
- **Layout.** The hero grid goes from a fixed 25rem column to about 52/48.
- **Entrance.** One 600ms CSS keyframe, `--animate-showcase-in`, not `Reveal`,
  which server-renders opacity 0 and waits for hydration. The reduced-motion
  baseline collapses it.
- **Loading.** `loading="eager"` without `fetchPriority="high"`. Measured: the
  headline stays the LCP even on a desktop, because the showcase first paints at
  opacity 0, and on a phone, where it is below the fold, a high-priority fetch
  only competed with the fonts.
- **Copy.** The second hero paragraph, `supportingLine`, is gone: its message is
  already in the Services lead, the Full-Stack value point and the About bio.
  `specialisms` is gone too; the code card was its only reader.
- **Removed.** `HeroCodeCard.tsx`, `TypedCode.tsx`, and the interim
  `heroPortrait` with its image. The technology marquee stays.

## Build steps

1. [x] Encode the render and add `profile.heroShowcase`.
2. [x] Build `HeroShowcase` with the CSS crop and both theme treatments.
3. [x] Replace the code card, widen the right column, and remove the second
   paragraph and the dead components and fields.

## Verify

- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` and
  `npm run preflight` pass.
- No painted hero text is visible at any width, in either theme, and nothing
  overflows horizontally.
- The page stays inside the budgets in `AGENTS.md`.

## Verification results (2026-10-06)

| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`, `npm run preflight` | Clean; every route static; preflight exits 0 |
| Browser at 390, 768, 1024, 1280 and 1440px, both themes | No painted text visible; no horizontal overflow |
| `/` at 1280px, cold cache | 561.8 KB total (ceiling 600), the showcase 66.7 KB, JS 253.8 KB, down from about 264 |
| `/` on a 390px 3x phone | 599.9 KB total; the showcase loads at full resolution, 126.1 KB |
| LCP | The headline on a desktop, the bio paragraph on a phone |

Open: the render's labels show a React Native app and a website for the North
City Islamic Youth Centre, neither of which has a case study, and mobile apps are
not one of the four services. Recorded in the overview's open questions.
