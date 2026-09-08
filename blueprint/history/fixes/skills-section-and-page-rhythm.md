# Fix: Skills section and page rhythm

**Type:** Fix

**Branch:** fix/skills-section-and-page-rhythm

**Status:** verified

## What was wrong

Two separate complaints, both raised while feature 6 was awaiting completion.

**1. The Skills cards.** Five cards in a three-column grid gave each card about
276px of width inside its padding. Every one of the thirty context sentences is
57 to 64 characters, so all thirty wrapped onto two lines, the cards ended up
ragged by up to 427px (760, 589, 675, 566, 333), and name and context were both
`text-sm` with only colour separating them. The technology marks, the fastest
scanning cue available, were `size-4` in `text-muted-foreground` and read as
noise. The section came to 1770px for what is supporting evidence.

**2. The gaps between sections.** `Section` carried `py-20 sm:py-28`. Two
adjacent sections each contribute their own padding, so the gap a reader saw was
224px at every boundary.

## What changed

**Skills is no longer a card grid.** Services is two large panels and Projects is
three image cards, so a third run of boxes was card fatigue, and the box was
what forced the narrow column. It is now a ruled index: the group name in a mono
rail on the left, skills in two columns beside it, hairline band separators.

- all 30 context lines now fit on one line, measured, up from 0 of 30
- bands are 285, 217, 285, 217, 149, tracking skill count rather than ragged
- name is `text-[0.95rem] font-medium` against context at `text-[0.8125rem]`
  muted, so the hierarchy no longer depends on colour alone
- marks are `size-[1.15rem]` at `text-foreground/80` and read as logos
- section height 1732px, slightly under the 1770px it replaced

**Page rhythm tightened at the source.** `Section` is now
`py-12 sm:py-14 lg:py-16`, so boundaries are 96px on a phone and 128px on a
desktop rather than 224px. The hero's bottom padding and `/projects` set their
own padding to sit in the same rhythm, and `Section.tsx` carries a comment
saying so, because there are three places to change rather than one.

## Files

| Path | Change |
|---|---|
| `src/components/sections/Skills.tsx` | card grid replaced with the ruled index |
| `src/components/primitives/Section.tsx` | `py-20 sm:py-28` to `py-12 sm:py-14 lg:py-16` |
| `src/components/sections/Hero.tsx` | bottom padding matched to the new rhythm |
| `src/app/projects/page.tsx` | section padding matched to the new rhythm |

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | clean |
| `npm test` | 82 passed across 4 files |
| `npm run build` | clean, `/` and `/projects` both `○ (Static)` |
| Context lines on one line | 30 of 30, measured in the browser |
| Section boundaries | 96px at 390, 112px at `sm`, 128px at `lg` |
| Reveals | all 5 Skills bands reach opacity 1 on a stepped scroll |
| Heading order | `h2` then five `h3`, unchanged |
| Responsive | 390, 768, 1440 in both themes, no horizontal overflow |
| First-load JS | 754,263 bytes on `/`, unchanged; the change is pure markup |

## Notes

`Reveal` wraps the band grid rather than being it. A motion element set to
`display: contents` generates no box, so its opacity and transform are ignored
and the entrance silently does nothing. That was caught and fixed during the
build.

The home page is about 690px shorter than before this fix, with no content
removed.
