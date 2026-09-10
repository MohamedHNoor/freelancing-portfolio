import type { SkillGroup } from "@/types/content";

/* Every `context` line names where the technology was actually used: the travel
   platform and this site are both in `projects.ts`, and the rest point at
   delivered client work or public repositories. Context is the whole point of
   this section. A line that describes the kind of thing a technology is for,
   rather than where it was used, is worth less than omitting the entry, and is
   the skill-percentage-bar problem wearing a different hat.

   Group order is the canonical order. The hero row reads the technology groups
   and skips Practices, which are not products with a logo. */
export const skillGroups = [
  {
    id: "front-end",
    label: "Front end",
    skills: [
      {
        name: "React",
        context:
          "The travel platform's SPA and every client build since 2023, from dashboards to landing pages.",
        icon: "react",
      },
      {
        name: "Next.js",
        context:
          "This site: App Router, server components, static generation for every route, and a Server Action for the one form.",
        icon: "nextjs",
      },
      {
        name: "TypeScript",
        context:
          "Strict mode on both projects here. On the travel platform it runs the full depth, from Drizzle schema to API response.",
        icon: "typescript",
      },
      {
        name: "JavaScript",
        context:
          "The language underneath, and still what most of my public repositories are written in.",
        icon: "javascript",
      },
      {
        name: "Tailwind CSS",
        context:
          "v4 on both projects here, CSS-first, with the design tokens defined once and the contrast between them enforced by a test.",
        icon: "tailwind",
      },
      {
        name: "shadcn/ui",
        context:
          "Radix primitives retuned to the brand palette on both projects, rather than shipped as stock components.",
        icon: "shadcn",
      },
      {
        name: "Redux",
        context:
          "State management on the e-commerce builds, where a cart has to stay consistent across routes and reloads.",
        icon: "redux",
      },
      {
        name: "React Hook Form",
        context:
          "This site's enquiry form, paired with a Zod schema the browser and the server both run.",
        icon: "react-hook-form",
      },
      {
        name: "Accessibility",
        context:
          "This site scores 100 on Lighthouse accessibility with zero axe violations in both themes, and contrast is a test that fails the build.",
      },
    ],
  },
  {
    id: "back-end",
    label: "Back end",
    skills: [
      {
        name: "Node.js",
        context:
          "The travel platform's API, and the backend of the inventory and dashboard work delivered to clients.",
        icon: "nodejs",
      },
      {
        name: "Express.js",
        context:
          "Express 5 on the travel platform: 15 route modules with middleware wiring, validation and thin controllers.",
        icon: "express",
      },
      {
        name: "REST APIs",
        context:
          "The travel platform's versioned API, covering search, bookings, payments, wallet, organisations and an admin surface.",
      },
      {
        name: "Server Actions",
        context:
          "This site's contact form: the only server work on an otherwise fully static site.",
      },
      {
        name: "Zod",
        context:
          "One schema shared by browser and server on this site, and validation at every request boundary on the travel platform.",
        icon: "zod",
      },
      {
        name: "Stripe",
        context:
          "Payment gateway work on platform builds, alongside Paystack on the travel platform, where webhooks are verified by HMAC before anything is trusted.",
        icon: "stripe",
      },
      {
        name: "Authentication",
        context:
          "The travel platform: a short-lived bearer token held in memory and a rotating refresh token in an httpOnly cookie, with no credential in localStorage.",
      },
    ],
  },
  {
    id: "data",
    label: "Data",
    skills: [
      {
        name: "PostgreSQL",
        context:
          "The travel platform's whole domain, including row-level security proved from a non-superuser connection.",
        icon: "postgresql",
      },
      {
        name: "MongoDB",
        context:
          "The MERN builds in my public repositories, including a notes board and two REST APIs.",
        icon: "mongodb",
      },
      {
        name: "Supabase",
        context:
          "An e-commerce store built on Next.js, with Supabase behind it and Clerk for auth.",
        icon: "supabase",
      },
      {
        name: "Neon",
        context:
          "Serverless Postgres behind a Node and Express shop management build.",
        icon: "neon",
      },
      {
        name: "Prisma",
        context:
          "The ORM on a Next.js and TypeScript e-commerce build.",
        icon: "prisma",
      },
      {
        name: "Drizzle",
        context:
          "The travel platform, including the conditional updates that make an inventory decrement and a wallet debit atomic.",
        icon: "drizzle",
      },
      {
        name: "Audit logging",
        context:
          "The travel platform's append-only ledger, with database constraints as the backstop rather than the plan.",
      },
    ],
  },
  {
    id: "tooling",
    label: "Tooling",
    skills: [
      {
        name: "Figma",
        context:
          "The starting point for the design-to-code track: reading the file first and listing every screen, state and breakpoint it implies but does not draw.",
        icon: "figma",
      },
      {
        name: "Git",
        context: "Every project here and 130 public repositories.",
        icon: "git",
      },
      {
        name: "Docker",
        context:
          "The travel platform ships as one image, so the same build runs on Railway, Fly, Cloud Run or a plain VPS.",
        icon: "docker",
      },
      {
        name: "GitHub Actions",
        context:
          "The travel platform's CI: lint, typecheck, test and build against a real Postgres container, all four required to pass.",
        icon: "github-actions",
      },
      {
        name: "Vitest",
        context:
          "297 tests on this site, covering validation, contrast, metadata and the deploy gate.",
        icon: "vitest",
      },
      {
        name: "Playwright",
        context:
          "Browser verification on this site: the keyboard walk, the axe sweep in both themes, and the reduced-motion pass.",
      },
      {
        name: "Vercel",
        context:
          "This site's deployment target, configured with its environment contract and a build that refuses to ship seeded example content.",
        icon: "vercel",
      },
    ],
  },
  {
    id: "practices",
    label: "Practices",
    skills: [
      {
        name: "Performance budgets",
        context:
          "This site records its transferred weight per route with a ceiling on each, measured in the browser because the build reports no sizes.",
      },
      {
        name: "Design fidelity",
        context:
          "Matching the file at every breakpoint, and saying so when a part of it should change: the reference for this site carried invented statistics, and they were removed rather than built.",
      },
      {
        name: "Written handover",
        context:
          "The codebase is handed over on delivery. Every client engagement I have taken has ended that way.",
      },
    ],
  },
] as const satisfies readonly SkillGroup[];
