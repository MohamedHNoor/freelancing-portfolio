# Fix: Canonical Tailwind classes

**Type:** Fix
**Status:** verified
**Branch:** none. Built in conversation rather than through `/fix`, on `main`, and
committed directly as `2b3ed29`. This log was written afterwards, on 2026-10-06.

## The problem

Tailwind IntelliSense flagged six arbitrary classes that have a canonical form,
in the hero's glow and the technology marquee.

## The fix

| File | Was | Now |
|---|---|---|
| `Hero.tsx` | `top-[-8rem] right-[-10rem] size-[34rem]` | `-top-32 -right-40 size-136` |
| `TechMarquee.tsx` | `[mask-image:linear-gradient(...)]` | `mask-[linear-gradient(...)]` |
| `TechMarquee.tsx` | `motion-reduce:[mask-image:none]` | `motion-reduce:mask-none` |
| `TechMarquee.tsx` | `hover:[animation-play-state:paused]` | `hover:paused` |

## Verification results (2026-10-06)

| Check | Result |
|---|---|
| Compiled CSS | The mask, `mask-none` and hover rules are identical. The spacing classes resolve through `--spacing`, Tailwind's default 0.25rem, to exactly -8rem, -10rem and 34rem |
| `npx tsc --noEmit`, `npm run lint`, `npm run build` | Clean |

The old hover class still compiles one unused rule, because
`hero-marquee-pause-control.md` in this folder names it and Tailwind scans the
whole repository.
