# Fix: Highlight on "Your Business"

**Type:** Fix
**Status:** verified
**Branch:** none. Built in conversation rather than through `/fix`, on `main`, and
committed directly as `2b3ed29`. This log was written afterwards, on 2026-10-06.

## The problem

The design reference sets "Your Business" in the hero headline as a violet
gradient. The headline is one content string, so there was nothing to style it
with.

## The fix

- **Content.** `profile.headlineEmphasis: "Your Business"`. A content invariant
  fails the build if the phrase is not in `headline`, so rewording one without
  the other cannot silently drop the highlight.
- **Logic.** `emphasise(line, phrase)` in `src/lib/headline.ts` splits a display
  line around the phrase's first occurrence and drops empty segments.
- **Tokens.** `--highlight-start` and `--highlight-end` for each theme: dark
  `oklch(0.7 0.19 292)` to `oklch(0.83 0.12 315)`, light `oklch(0.48 0.22 290)`
  to `oklch(0.52 0.23 318)`. The headline is semibold and 23px on a phone, which
  is not large text, so all four ends hold 4.5:1 (5.8 to 11.2:1) and sit in the
  contrast test's pair table.
- **Rendering.** `bg-clip-text` over a left-to-right gradient, with
  `box-decoration-clone` in case the phrase wraps. Print and forced colours drop
  the gradient and fall back to the heading's colour, since transparent text over
  a removed background would vanish.

## Build steps

1. [x] Add the field, the invariant, `emphasise` and their tests.
2. [x] Add the tokens and their contrast pairs.
3. [x] Render the phrase in the hero with the print and forced-colours fallbacks.

## Verify

- `npm test` passes with the new tests, including the contrast pairs.
- The heading's accessible name is unchanged, and the phrase stays visible in
  print and forced-colours emulation.

## Verification results (2026-10-06)

| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npm run lint`, `npm run build` | Clean |
| `npm test` | 352 tests, 14 new: `emphasise`, the invariant, two contrast pairs |
| Heading text, 5 runs | "Mohamed Noor · Full-Stack Web Developer Websites and Web Applications Built for Your Business" in every mode |
| Print and forced-colours emulation | Solid text, no background image |
