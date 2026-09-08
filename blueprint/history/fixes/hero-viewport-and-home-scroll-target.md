# Fix: Hero fills the viewport, and the home page scroll target

**Type:** Fix

**Branch:** fix/hero-viewport-and-home-scroll-target

**Status:** verified

## What was wrong

Two defects reported together during review of feature 7.

**1. Navigating to `/` landed past the hero.** Clicking `Back to home` on the 404
page, or the header logo from any route, put the visitor 622px down the page with
the `h1` 423px above the top of the viewport. The one thing a first-time visitor
has to see was the one thing they never saw.

Traced frame by frame rather than guessed at: the page arrived at scroll 0
correctly, then *smoothly animated* to 622 over about 600ms. 622 is exactly the
position that scrolls the credibility strip into view under the 88px
`scroll-padding-top` in `globals.css`.

The cause was `src/app/page.tsx` returning a **fragment of seven sections**. On a
client navigation Next picks the first DOM node of the changed segment as its
scroll target, and a fragment offered seven candidates. `scroll-behavior: smooth`
on `html` turned the resulting jump into a visible glide. The diagnostic tell was
that `/projects` never had the bug and already returned a single root element.

**2. The hero did not fill the screen.** It was 693px tall in a 900px viewport,
so the page opened on a hero with the credibility strip crowding in underneath
rather than on a deliberate first screen.

## What changed

| Path | Change |
|---|---|
| `src/app/page.tsx` | the seven sections are wrapped in one root `div`, giving Next a single unambiguous scroll target |
| `src/components/sections/Hero.tsx` | `flex min-h-[calc(100svh-4rem)] items-center`, so the hero fills the space below the sticky header with its content centred |

`svh` rather than `vh` or `dvh` is deliberate: `vh` ignores mobile browser chrome
and pushes the call to action underneath it, and `dvh` makes the hero resize
while the URL bar hides, which moves the headline as the page scrolls. `4rem` is
the header's `h-16`.

It is a minimum, not a fixed height. On a phone the stacked headline, bio,
buttons, marquee and code card come to 1149px, well past the 780px minimum, so
the rule stops applying rather than clipping anything.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | clean |
| `npm test` | 88 passed across 4 files |
| `npm run build` | clean, route table unchanged |
| 404 `Back to home` | scroll 0, `h1` visible, was 622 |
| Header logo from `/projects` | scroll 0, was 622 |
| Header logo from a case study | scroll 0 |
| Card to case study, case study to `/projects` | scroll 0, unchanged |
| `/#skills` anchor | still resolves to the skills section |
| Hero at 1440 by 900 | 836px tall against 835px available below the header |
| Hero content alignment | starts at x=144, identical to the header and every section |
| Hero at 390 by 844 | 1149px tall, headline and call to action both visible on load, no horizontal overflow |

## Notes

**Width was deliberately not changed, and this is the one open question.** The
hero `section` already spans the full viewport width and the glow bleeds past it.
What is constrained is the content column at 1152px, starting at x=144, which is
exactly where the logo, the navigation and every other section start. Widening
only the hero would misalign it against the header. Taking the hero content
edge to edge, or widening the whole site container, are both larger decisions
the user has not made yet.
