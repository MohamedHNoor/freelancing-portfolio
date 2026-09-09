# Feature: Resume

**From build-plan:** feature 8

**Branch:** feature/resume

**Status:** verified

## Goal

A `/resume` route rendered entirely from the content layer, laid out for the
screen and for paper, with a way to get a PDF.

The build-plan line asks for "plus a downloadable CV". `profile.links.cv` is the
empty string and no file exists in `public/`, so that half was raised as a
blocker and the user chose to proceed. It is not built as a stub: the download
renders only when a CV is actually supplied, the same content-driven pattern
`getProfileLinks` and `getProjectLinks` already use. Until then the page's own
print layout is the route to a PDF, through the browser's Save as PDF, which
works today and needs no file.

## In scope

- `src/app/resume/page.tsx`: static route, its own `h1`, minimal `metadata`
- Resume body from the content layer: identity and contact, summary, experience,
  skills, selected projects
- `@media print` rules in `globals.css` that apply site-wide: chrome hidden, the
  theme's dark surfaces forced back to ink on white, entries kept off page breaks
- A print button, the one client island this feature adds
- A CV download link that renders only when `profile.links.cv` is non-empty
- `toContactLink` in `src/lib/links.ts`, with tests
- `/resume` added to `NAV_ITEMS` so the route is reachable
- The route stays statically generated

## Out of scope

- **Generating a PDF.** No renderer, no headless export, no `@react-pdf`. The
  print stylesheet plus the browser is the mechanism.
- **`isPlaceholder` on `Role`.** `Project` carries the flag and this page honours
  it; `Role` has no such field, so the invented employment history prints with no
  marker at all. Adding the field is a content-contract change and belongs with
  the user's decision, not buried here. Recorded under Notes.
- **Rewriting `NAV_ITEMS` from anchors to routes.** Feature 9 owns that. This
  feature appends one route item to the existing list.
- Canonicals, Open Graph, structured data, sitemap. Feature 11.
- Editing any file in `src/content/`.

## Build loop

`workflow.stepReview` is `feature`, `workflow.checkpointCommits` is `disabled`:
work through every step, present one review packet, no commits. `/complete`
makes the single feature commit.

`qualityGates.regular` sets audit, check and try guide to `manual`, independent
review to `when-sensitive`. This feature adds no authentication, authorization,
payment, secret, personal data, migration or external side effect, and every
value it renders is authored in the repository, so no gate is selected
automatically.

## Build steps

- [x] 1. **`toContactLink`, with tests.**
  Add `src/lib/links.ts` per Data / contracts and cover it in
  `tests/lib/links.test.ts`. Nothing imports it yet.
  **Done when:** `npm test` passes with the new cases and the existing 88 still
  green; `npx tsc --noEmit` clean.

- [x] 2. **The route: identity, contact, summary, experience.**
  Add `src/app/resume/page.tsx`. Roles come from `getRoles()`, already sorted
  newest first, with dates through `formatYearMonth` and `formatRoleEnd` from
  `src/lib/dates.ts`. Do not re-sort and do not format dates any other way.
  **Done when:** `/resume` returns 200 and renders one `h1` carrying the name,
  the headline, location, the summary, and every role with its dates, title,
  company, summary, impact bullets and stack; the contact line renders nothing
  at all today because every `profile.links` value is empty; browser evidence at
  390 and 1440.

- [x] 3. **Skills and selected projects.**
  **Done when:** the page lists every skill group with its technology names, and
  the featured projects with title, summary and stack; a project with
  `isPlaceholder` carries the same `Example project` marker the cards and case
  studies use; skill usage context is deliberately absent, and the reason is in
  a comment.

- [x] 4. **Print layout and the print button.**
  Add the `@media print` block to `src/app/globals.css` and
  `src/components/resume/PrintButton.tsx`.
  **Done when:** with Playwright emulating print media, the header, footer, skip
  link, theme toggle and the print button itself are all absent from the printed
  page; text renders dark on a white background with the `dark` class still on
  `html`; no role entry is split across a page break; on screen nothing changes,
  verified by comparing the screen render before and after.

- [x] 5. **Reachability, the CV download, and verification.**
  Append `{ label: "Resume", href: "/resume" }` to `NAV_ITEMS`.
  **Done when:** Resume appears in the header and mobile navigation and carries
  `aria-current="page"` on `/resume` and nowhere else; the CV download is absent
  with `links.cv` empty; `npx tsc --noEmit`, `npm run lint`, `npm test` and
  `npm run build` all pass; `/resume` is `○ (Static)` in the route table; the
  chunk-byte total is recorded; 390, 768 and 1440 in both themes with no
  horizontal overflow; the console is clean.

## Files / areas

**New**

| Path | Kind |
|---|---|
| `src/app/resume/page.tsx` | server, static |
| `src/components/resume/PrintButton.tsx` | `"use client"` |
| `src/lib/links.ts` | pure logic |
| `tests/lib/links.test.ts` | Vitest, node |

**Modified**

| Path | Change |
|---|---|
| `src/app/globals.css` | add the `@media print` block |
| `src/lib/site.ts` | append the Resume route item |

**Read only**

`src/content/*`, `src/types/content.ts`, `src/lib/dates.ts`,
`src/components/ui/*`, `src/components/layout/NavLink.tsx`.

## Data / contracts

Nothing is persisted and nothing crosses a trust boundary. Every value rendered
is authored in `src/content/`, so there is no user-controlled text and no
escaping rule beyond React's default.

```ts
export type ContactLink = {
  key: ProfileLinkKey;
  /** Ready for an `href`, scheme included. */
  href: string;
  /** What a reader sees, and what survives being printed on paper. */
  label: string;
};

export function toContactLink(link: ProfileLink): ContactLink;
```

- **Tolerant about scheme, because the content layer never settled one.**
  `profile.links.email` may hold a bare address or a `mailto:` URL; github and
  linkedin may or may not carry `https://`. Rather than force a content decision
  from here, accept both: prepend `mailto:` to an email that lacks it, prepend
  `https://` to a web link that lacks a scheme, and leave an already-qualified
  value untouched. Comparison is case-insensitive on the scheme only.
- **The label is the address, not a word.** `GitHub` as link text is useless on
  paper, where the href is invisible. Labels are the human-readable address with
  the scheme and any trailing slash removed, so `https://github.com/x/` prints as
  `github.com/x`, and an email prints as the address itself.
- `cv` never appears in the contact line. It drives the download button instead,
  and `toContactLink` is not called for it.
- Input comes from `getProfileLinks()`, which already drops unsupplied values, so
  this function never sees an empty string.

## Testing

`tests/lib/links.test.ts`, mirroring `src/lib/links.ts`.

**Scheme tolerance**
- a bare email gains `mailto:`
- an email already carrying `mailto:` is unchanged
- a bare `github.com/x` gains `https://`
- an `https://` link is unchanged
- an `http://` link keeps `http://` rather than being silently upgraded
- an uppercase `HTTPS://` prefix is recognised and not doubled

**Labels**
- `https://github.com/x` labels as `github.com/x`
- a trailing slash is removed
- `mailto:a@b.com` labels as `a@b.com`
- a bare email labels as itself
- the label never contains a scheme

Layout, print behaviour and navigation are verified in the browser.

## Notes for the AI

**Decisions taken.**

1. **Print styles are global, not scoped to `/resume`.** Printing any page of
   this site should drop the sticky header, the footer and the skip link, and a
   case study printed for a client benefits from the same treatment. Scoping
   them to one route would mean every later print need re-solves it.
2. **Print forces light.** The `dark` class stays on `html` when a visitor
   prints from the default theme, so without an override the printed page is
   either near-black ink over the whole sheet or invisible text. The print block
   sets its own colours rather than trusting the theme.
3. **The print button is a client component and nothing else is.** It exists to
   call `window.print()`. Keep it a leaf; do not make the page a client
   component to accommodate it.
4. **Skills print as names only.** The thirty usage-context lines are the whole
   point of the Skills section on the site and are wrong on a resume, where the
   reader is scanning for a match in seconds. Put the reason in a comment so it
   does not get "fixed" later.
5. **The resume reuses `src/lib/dates.ts`.** That module was built in feature 5
   for exactly this second consumer. Do not add a second date format.

**Constraints carried in from earlier features.**

- Every list needs `role="list"`: Tailwind preflight sets `list-style: none` and
  WebKit then drops list semantics.
- One `h1` per page. Resume sections are `h2`.
- Page padding follows the shared rhythm, `py-12 sm:py-14 lg:py-16`, and the
  container stays `max-w-6xl`.
- Server components by default; `PrintButton` is the only island.
- `NavLink` marks a route item current; it treats anything containing `#` as an
  anchor and never marks it.

**The honesty problem this page makes worse, and cannot fix.** A resume is the
artifact people forward, save and check. This one prints three invented roles at
"Example Health" and "Example Studio" with dates that were made up, and unlike
`Project` the `Role` type carries no `isPlaceholder` flag, so nothing on the page
can mark them and feature 13's deploy gate cannot see them either. The featured
projects on the same page *will* carry their marker, which makes the contrast
sharper rather than safer. Two ways out, both the user's call and neither taken
here: supply the real history, or add `isPlaceholder` to `Role` so the marker and
the deploy gate cover employment too. Say this plainly in the review packet.

**Evidence method for print.** Use Playwright's print media emulation to verify
the print layout; do not infer it from the stylesheet. Return the page to screen
media afterwards so later screenshots are not taken in print mode.



## Verification record

| Check | Command or method | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | PASS |
| Lint | `npm run lint` | PASS |
| Tests | `npm test` | PASS, 102 across 5 files, 14 added |
| Build | `npm run build` | PASS |
| Route table | build output | `/resume` is `○ (Static)` |
| First-load JS, `/resume` | chunk-byte sum | 731,395 bytes, the lightest route on the site |
| First-load JS, `/` | chunk-byte sum | 754,407 bytes, up 32 for the extra nav item |
| Structure | prerendered HTML and browser | one `h1`, three `h2`, six `h3` |
| Dates | prerendered HTML | five `<time>` elements, correct months, `Present` for the open role |
| Contact line | browser | location only; every `profile.links` value is empty so nothing else renders |
| CV download | browser | absent, correct with `links.cv` empty |
| Placeholder marker | browser | `Example project` on all three featured projects |
| Print, chrome | print media emulation | site header, site footer, skip link and print button all `display: none` |
| Print, colours | print media emulation | black on white with `dark` still on `html`; muted resolves to `rgb(89, 89, 89)` |
| Print, page breaks | print media emulation | `break-inside: avoid` on role entries, `break-after: avoid` on headings |
| Print, the name | print media emulation | `h1` renders at 896 by 40 and reads `Mohamed Noor` |
| Screen unaffected | browser | screen render unchanged by the print block |
| `aria-current` | browser | exactly one, on Resume, on `/resume`; none on `/` |
| Responsive | 390, 768, 1440 in both themes | no horizontal overflow in any of the six combinations |
| Console | browser | 0 errors, 0 warnings |

### A defect the static checks could not have found

The first print emulation showed the resume starting at the summary: **the
printed page had no name on it.** The print block hid `header, footer`, and
`header` matches every `<header>` in the document, including the one inside the
resume `<article>` carrying the name, the headline and the contact line.

`tsc`, lint, tests, the build, and reading the built CSS all passed while this
was true, and the prerendered HTML looked correct because the element was
present and merely hidden by a media query. Only rendering it under print media
exposed it.

Fixed by removing the element selectors entirely: the site header and the site
footer now set `data-print-hidden`, the same opt-out the print button already
used, so the rule can only ever match chrome that asked to be hidden.

### Deviations from the spec as written

1. **`Header.tsx` and `Footer.tsx` were modified.** The spec's file list did not
   include them. Required by the defect above: scoping the print rule correctly
   means the chrome has to identify itself rather than be matched by tag name.
2. **`.sr-only` was added to the print hidden rule.** Not specified. The skip
   link is already clipped to zero ink by `clip-path: inset(50%)`, so this
   changes nothing visually, but it makes the step 4 done-when of "absent"
   literally true and keeps screen-reader-only text out of page-break maths.

### Carried forward

- **The employment history prints unmarked.** Three invented roles at
  "Example Health" and "Example Studio" with fabricated dates. `Project` carries
  `isPlaceholder` and the three projects on this same page are marked; `Role`
  has no such field, so nothing marks the roles and feature 13's deploy gate
  cannot see them. A resume is the artifact people forward and check. Either
  supply the real history or add `isPlaceholder` to `Role`.
- **The CV download has never rendered.** `profile.links.cv` is empty, so the
  button's populated state is unreachable from current content, exactly as with
  `getProjectLinks` in feature 7.
- **The header and footer navigation lists still lack `role="list"`.**
  Confirmed again here: five of seven lists on `/resume` carry it, and the two
  that do not are both from feature 1. Feature 12 owns that sweep.
