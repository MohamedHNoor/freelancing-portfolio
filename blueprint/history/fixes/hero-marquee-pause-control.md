# Fix: Hero marquee pause control

**Type:** Fix

**Status:** verified

**Branch:** fix/hero-marquee-pause-control

## The problem

The hero technology row scrolls automatically and never stops. WCAG 2.1 SC
2.2.2 (Pause, Stop, Hide, Level A) requires a mechanism to pause, stop, or hide
any motion that starts automatically, runs longer than five seconds, and sits
alongside other content. This row does all three: `src/app/globals.css:15`
declares `marquee 48s linear infinite`.

The only pause today is `hover:[animation-play-state:paused]` at
`src/components/sections/Hero.tsx:104`. That is a mouse affordance. The row is a
`<ul>` of plain `<li>` chips with nothing focusable inside it, so a keyboard-only
user cannot reach the hover state and has no way to stop the motion at all.

`prefers-reduced-motion` is already handled (`motion-reduce:animate-none` plus a
wrapped static reflow) and is not the gap. That setting accommodates vestibular
sensitivity; it is not the user-facing mechanism 2.2.2 asks for, and a visitor
who simply wants to read a mark has no route to stopping it.

axe cannot detect this, which is why the feature 12 pass came back clean. It was
found by reading the markup, and it now matters more than it did: feature 12 put
"WCAG 2.1 AA" on the credibility strip, so an uncorrected Level A gap is a claim
the site does not meet.

## The fix

Add a small pause and resume control beside the "Working with" label, and drive
the animation from it.

`Hero.tsx` is a server component and must stay one, so the marquee moves into a
new leaf client component rather than making the whole hero interactive. That
follows the standards' rule to keep client components small and at the leaves;
the hero's known client islands stay as they are.

Behaviour:

- Default is playing, exactly as today. Nothing about the first paint changes.
- The control toggles the track's `animation-play-state`. Paused persists until
  the visitor resumes it or reloads; it is not stored.
- The existing hover pause stays for mouse users, and an explicit pause from the
  control wins over it.
- Under `prefers-reduced-motion` there is no animation to control, so the button
  does not render. Do this in CSS (`motion-reduce:hidden`) rather than by
  branching on a media query in render, which would desynchronise hydration.
  `TypedCode` documents that same trap.
- The accessible name states the action and changes with state: "Pause the
  technology row" and "Resume the technology row". Do not also set
  `aria-pressed`; a changing name plus a toggle state double-announces.

Must not break: the seamless two-copy loop, the `aria-hidden` on the duplicate
copy, the `aria-labelledby` tie from the visible list to `#hero-stack-label`, the
reduced-motion wrapped reflow, the mask gradient, or the LCP behaviour of the
hero (nothing here is the largest contentful element, and nothing may start at
`opacity: 0`).

If the control is unwanted in the hero, the alternative that also satisfies 2.2.2
is dropping the animation and always rendering the wrapped static row that
reduced motion already produces. That is a design decision, so this spec takes
the control route and leaves that as the fallback.

## Build steps

- [x] 1. **Extract the marquee and give it a pause control.** Create
  `src/components/sections/TechMarquee.tsx` as a `"use client"` leaf holding the
  track, both `TechRow` copies, and the new button; move `TechRow` and its props
  type into it, since the marquee is its only caller. Render
  `<TechMarquee marks={marks} />` from `Hero.tsx` in place of the current block,
  keeping the `marks.length > 0` guard and the `#hero-stack-label` paragraph
  where they are. Use `PauseIcon` and `PlayIcon` from `lucide-react`, already a
  dependency, marked `aria-hidden`. Give the button the same
  `focus-visible:ring-2 focus-visible:ring-ring` treatment the rest of the site
  uses, and `text-muted-foreground`, which measured 7.96:1 dark and 6.38:1 light
  in feature 12. **Done when** `npm run build` and `npm test` are green, and on a
  production server: tabbing from "See case studies" reaches the button, Space
  and Enter both toggle it, the row visibly stops and restarts, the accessible
  name changes with state, the button is absent under emulated
  `prefers-reduced-motion` while the row still renders wrapped and static, and
  axe reports zero violations on `/` in both themes.

## Verify

1. `npm run build && npm start`, then open `/`.
2. Tab from the top. After "See case studies" the pause control takes focus with
   a visible ring. Press Space: the row stops. Press Enter: it starts again.
3. Check the accessible name flips between "Pause the technology row" and
   "Resume the technology row" as it toggles.
4. Hover the row with a mouse: it still pauses, and still resumes on leave.
5. Turn on Reduce Motion in the OS and reload: no button, and the row renders as
   a static wrapped grid.
6. Re-run axe over `/` in both themes: zero violations, unchanged from feature 12.
