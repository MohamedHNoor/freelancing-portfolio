# Fix: Anchor offset and the projects index LCP image

**Type:** Fix

**Branch:** fix/anchor-offset-and-index-lcp

**Status:** verified

## What was wrong

**1. Every section anchor landed 184px down instead of 88px.** Flagged during
feature 6 and carried forward twice. The cause was arithmetic, not timing:
`Section` set `scroll-mt-24` (96px) and `html` set `scroll-padding-top: 5.5rem`
(88px), and the two stack rather than overlap. The browser lines the element's
scroll *margin* box up with the container's scroll *padding* edge, so 96 + 88
put every heading 184px below the viewport top, well clear of the 65px header it
was meant to clear.

**2. `/projects` reported its first cover image as the Largest Contentful Paint
element** and asked for `loading="eager"`. Deferred from feature 6 for want of a
measurement, then measured by feature 7 on the case study route.

## What changed

| Path | Change |
|---|---|
| `src/components/primitives/Section.tsx` | `scroll-mt-24` removed; `scroll-padding-top` is the single mechanism |
| `src/components/projects/ProjectCard.tsx` | new optional `priority` prop, defaulting to false |
| `src/components/projects/ProjectIndex.tsx` | passes `priority` to the first visible card only |

`scroll-padding-top` is the one that survives because it is set once on the
scroll container and also covers `#main-content` and any anchor a later feature
adds, where `scroll-mt` has to be remembered on every new target.

`priority` is opt-in rather than automatic. The home page's Projects section must
never take it: it sits far below the fold there, and preloading it would compete
with the hero for bandwidth on the one screen that decides whether a visitor
stays.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS, 88 across 4 files |
| `npm run build` | PASS |
| Anchor landing, fresh load of `/#about` | 88px, was 184 |
| Anchor landing, nav clicks to services, skills, experience | 88px each, was 184 |
| `/projects` console | 0 errors, 0 warnings; the LCP notice is gone |
| First index card | eager, preloaded; the other two stay lazy |
| Card cover source | 618px needed, 750w chosen, correct bucket |
| Container width | 1152px, unchanged |

## Notes

A site-wide widening to 1280px was built and measured during this fix, then
reverted at the user's request. Two things learned while it was in place are
worth keeping even though the change is gone: the container width is set in nine
places across eight files, and `CaseStudyHeader`'s cover `sizes` has to move with
it, because Next's width buckets step 1080, 1200, 1920 and a request just over a
bucket edge fetches the next one up.
