# Freelance Portfolio

A personal portfolio site for a freelance developer, focused on two kinds of work:
Figma to Next.js website builds, and healthcare or fintech SaaS platform
engineering. Projects are presented as case studies (problem, approach, stack,
outcome) rather than screenshots.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4,
shadcn/ui, and Motion.

## Commands

```bash
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npx tsc --noEmit   # typecheck
```

No test runner is configured yet.

## Content

All site content lives in typed modules under `src/content/`. Editing the site's
text, projects, skills, and experience does not require touching components.

## Environment

Copy `.env.example` to `.env.local` and fill in the values. The contact form needs
a Resend API key and a verified sender domain to deliver mail in production.

## Working on this project

Agent instructions live in [AGENTS.md](AGENTS.md).
