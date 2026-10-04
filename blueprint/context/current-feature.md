# Fix: Full-stack positioning and content update

**Type:** Fix

**Branch:** fix/full-stack-positioning

**Status:** in progress

## The problem

The site sells three narrow tracks (white-label for agencies, startup SaaS, Figma
to Next.js) with agency and startup copy throughout. The owner's brief repositions
it as a full-stack web development business for businesses, startups and agencies
in New Zealand, Australia and internationally, with one conversion path:

Google / LinkedIn / GitHub → portfolio → case study → Start a Project → enquiry.

Content only: the visual design, the hero's code card and technology row, and the
existing components stay. Nothing may be invented, and the TravelGrid case study
has drifted from its repository (frontend now Next.js 16, sessions now Better
Auth, the 234-test figure is stale).

## The fix

- **Services:** four, replacing the three tracks: business websites, custom web
  applications, SaaS development, Figma to production. Timelines only where one
  already existed; the white-label terms move to the Agencies audience
- **Home, in the brief's order:** hero, value points, what I build, who I work
  with, selected work, why work with me, process, technology, about, location,
  final call to action. Each section is a summary that links to its page
- **Navigation:** Home, Services, Work (`/projects`), Process (new `/process`),
  About, Contact, plus a Start a Project button. Skills, Experience and Resume
  keep their routes and are linked from About and the footer
- **Case studies:** ten sections (Overview, The Problem, The Solution, Key
  Features, Architecture, Engineering Challenges, Testing, Technology, My Role,
  Outcome) from existing copy and TravelGrid's README, every metric re-verified,
  and a Start a Project block at the end of each
- **Contact form:** company, eight project types, existing design, NZD budget
  brackets, five timeline options, "Send Project Enquiry". The honeypot is
  renamed, since `company` becomes a real field
- **SEO:** the brief's titles and descriptions, the social image tagline, `/process`
  in the sitemap
- **Plans:** `project-plan.md` positioning and the no-prices rule (budget brackets
  allowed in the form only), `AGENTS.md`, `README.md`

Must not break: static generation of every public route, the CSP, the contact
action's fail-closed and idempotency behaviour, the deploy gate, AA contrast, and
the budgets in `AGENTS.md`.

## Build steps

1. **Content model** - types, invariants and content modules for services,
   audiences, reasons, process, milestones and value points. Done when `npm test`
   passes with the new invariants.
2. **Case studies** - both projects in ten sections with verified metrics, and a
   Start a Project block on every case study. Done when both render and every
   number traces to a source.
3. **Home and pages** - the home sections in order, `/process`, and the services,
   about, work and contact pages. Done when every route builds static.
4. **Navigation and footer** - nav items, Start a Project button, footer. Done when
   the sitemap guard and nav tests pass.
5. **Contact form** - new fields, honeypot rename, email body. Done when the
   schema and action tests pass.
6. **SEO** - metadata, social image, structured data. Done when the SEO tests pass.
7. **Plans and docs** - project plan, `AGENTS.md`, README.

## Verify

- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` (every public
  route static in the route table)
- Browser pass over every route in both themes and at phone width, axe clean
- Re-measure home and case study transfer sizes against the `AGENTS.md` budgets
- Submit the contact form in development and confirm the new fields arrive
