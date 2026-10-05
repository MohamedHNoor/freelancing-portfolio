# Fix: Resume description positioning

**Type:** Fix
**Status:** verified
**Branch:** fix/resume-description-positioning
**Fixes:** F-14

## The problem

`/resume` still describes the positioning that the full-stack repositioning
replaced. Its `description` in `src/app/resume/page.tsx:20` reads "Experience,
stack and selected work for a freelance software engineer building white-label
sites for agencies, SaaS products for startups, and Figma to Next.js sites."

`routeMetadata` copies that string into Open Graph and Twitter, so the
prerendered `/resume` carries the old three-track wording in its `description`,
`og:description` and `twitter:description` tags. That is the snippet a search
result or a LinkedIn share of the resume shows. Every other route's description
already uses the new positioning.

## The fix

Replace the string with one in the same voice as the other routes, naming the
role and location the way `/about` and `/contact` do:

> Resume of Mohamed Noor, a full-stack web developer in Wellington, New Zealand,
> with work history, technology and selected projects on one printable page.

It must not break:

- the `Resume` title and the `%s | Mohamed Noor` template
- `routeMetadata("/resume")` and its canonical URL
- static generation of `/resume`

No logic changes, so no new test: this is copy, verified in the built HTML.

## Build steps

1. **Rewrite the description** - replace the string in
   `src/app/resume/page.tsx`. Done when the prerendered `/resume` HTML carries
   the new sentence in `description`, `og:description` and
   `twitter:description`, and the page contains no "white-label" text.

## Verify

- `npx tsc --noEmit`, `npm run lint`, `npm test` and `npm run build` pass, with
  `/resume` still static.
- In `.next/server/app/resume.html`, the three description tags hold the new
  sentence and `grep -c white-label` returns 0.
- Optional: run `npm start`, open `/resume`, and check the description in the
  page source.

## Verification results (2026-10-05)

| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npm run lint` | Clean |
| `npm test` | 336 tests in 15 files, all passing |
| `npm run build` | `/resume` static |
| Built `resume.html` | New sentence in `description`, `og:description` and `twitter:description`; title `Resume \| Mohamed Noor`; canonical `https://www.mohamedhnoor.com/resume`; 0 "white-label" |
