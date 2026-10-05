# Fix: Recruiter-focused resume

**Type:** Fix
**Status:** verified
**Branch:** none. Built in conversation rather than through `/fix`, on `main`, and
committed directly as `2b3ed29`. This log was written afterwards, on 2026-10-06.

## The problem

`/resume` read as another page of the freelance site: the marketing intro, every
skill in `skills.ts`, "Freelance software engineer at Independent", and project
summaries written for buyers. It sat inside the site header and footer, and its
print output had problems of its own:

- **Navigation reported twice**, between Skills and Selected Work. Not
  reproducible: the DOM, the layout, print emulation and a generated PDF each held
  one header or none. The position fits a scroll-and-stitch full-page capture of
  the sticky header at a 764px window, whose third frame starts at y 1528 where
  the boundary sits at y 1505. Not confirmed, but the fix removes the header from
  the route either way.
- `section { break-inside: avoid }` moved any section that did not fit whole onto
  the next sheet.
- No `@page` rule, so no A4 size or margins.
- With background graphics on, the dark theme printed dark page margins:
  `color-scheme: dark` paints the canvas even with every token set to white.
- The PDF text layer read back broken in the site's variable web fonts: 3 of 13
  keywords whole in PDFKit ("Reac t", "Welling t on"). The resume printed before
  this change did the same. Wide tracking read back as spaced letters
  ("P R O F E S S I O N A L").

## The fix

- **Route groups.** Every public page except `/resume` moves into
  `src/app/(site)/`, whose layout renders `SiteChrome` (header,
  `<main id="main-content">`, footer). The root layout keeps the document shell,
  `MotionProvider` and `SkipLink`. The root `not-found.tsx` wraps itself in
  `SiteChrome`, since an unmatched URL never enters the group. URLs are
  unchanged. This is most of feature 15's route-group step; the build plan and
  `dashboard-architecture.md` §19 record what remains.
- **Standalone resume.** `/resume` renders its own `ResumeToolbar` (the logo back
  home, the theme toggle, the print button, and a CV download once a file exists)
  and its own `<main>`. Not sticky, screen only.
- **Content.** `src/content/resume.ts` holds the title, the summary, experience
  and professional-development entries that point at `experience.ts` roles for
  their dates, and project entries that point at `projects.ts` for name, stack
  and period. New invariants reject an unknown role, an unknown project, or a
  technology not in `skills.ts`. `skills.ts` gains a `resume` flag on 36 entries
  and one new entry, "PostgreSQL Row-Level Security", written from the TravelGrid
  metric's evidence. New helpers: `getResume`, `getResumeExperience`,
  `getResumeDevelopment`, `getResumeProjects`, `getResumeSkillGroups`, and
  `pickSkills`, which `getFeaturedSkillGroups` now shares.
- **Components** in `src/components/resume/`: `ResumeSection`, `ResumeItem`,
  `DotList` (middle-dot lists that break only after a dot and keep each item
  whole), `ResumeToolbar`, and `PrintButton`, with a shorter label on phones.
- **Links.** `displayUrl` in `src/lib/links.ts` prints `mohamedhnoor.com` and
  `linkedin.com/in/mohamedhnoor` without the scheme or `www.`.
- **Print rules** in `globals.css`: `@page { size: A4; margin: 14mm 15mm }`;
  `break-inside: avoid` on `li` only; orphans and widows of 3;
  `color-scheme: light`; the resume (`[data-resume]`) set in Helvetica Neue, with
  its uppercase labels tightened through `print:tracking-[0.04em]`.
- **Metadata.** The title becomes "Full-Stack Software Engineer Resume | Mohamed
  Noor".

The brief asked for some claims the content layer does not support, so they were
left out and reported: "5+ years" (freelance since 2023-08, so "3+"),
test-driven development and code reviews at Microverse, a third project, and the
site's 88 ms LCP, which was measured before the hero changed.

Side effects:

- The case studies' `og:image` URLs gained Next's route-group suffix
  (`/projects/[slug]/opengraph-image-umay0l`), and the old URLs return 404. The
  pages declare the new ones.
- `/` lost its `og:image` when the page left the root image file's segment.
  `routeMetadata("/")` now attaches the card, as it does for every other route.
- Next embeds the root 404's tree in every page's payload, so wrapping it in
  `SiteChrome` adds 1.2 to 1.7 KB gzipped to each first load.

## Build steps

1. [x] Move the public pages into `(site)` behind `SiteChrome`, and keep the 404's
   header and footer.
2. [x] Add the resume content, its invariants, the `resume` skill flag and the
   helpers, with tests.
3. [x] Build the resume components and the standalone page.
4. [x] Fix the print rules, the dark-theme margins and the PDF text layer.

## Verify

- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` and
  `npm run preflight` pass, with every public route static.
- Metadata on every route matches a snapshot taken before the move, apart from
  intended changes.
- axe finds no violations; the keyboard path and print button work.
- An A4 PDF from either theme is white, one to two pages, and its text layer
  reads back whole.

## Verification results (2026-10-06)

| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run preflight` | Clean; every route static; preflight exits 0 |
| `npm test` | 370 tests, 18 new across the content layer and `displayUrl` |
| Metadata, 12 routes | Identical to the snapshot except the resume title and the case-study image suffix |
| Site chrome per route | One header and footer on site pages and the 404; none on `/resume` |
| axe 4.13, WCAG 2.1 A and AA plus best practice | 0 violations in 26 runs: 12 routes in both themes, plus `/resume` and the 404 at 360px |
| Keyboard on `/resume` | Logical order with focus rings; the skip link lands in `<main>`; Enter on the print button calls `window.print()` once |
| PDF, A4, dark and light theme, background graphics on | 2 pages; white margins; 22 of 22 keywords read back whole; no site navigation text |
| Widths from 360 to 1280px | No horizontal overflow |
