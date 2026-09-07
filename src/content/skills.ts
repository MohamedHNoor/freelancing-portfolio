import type { SkillGroup } from "@/types/content";

/* The technology list is the developer's own; the `context` lines are still
   PLACEHOLDER and describe the kind of use rather than a specific engagement.
   Replace each one with where you actually used it. Context is the whole point
   of this section, and a vague line is worth less than omitting the entry.

   Group order is the canonical order. The hero row reads the technology groups
   in this order, so anything moved here moves there too.

   `icon` is a key into the registry in `src/components/icons/TechIcon.tsx`.
   Entries without one are capabilities rather than branded products, so they
   have no logo and stay out of the hero row. Playwright has no mark in the
   icon set, so it is in the same position. */
export const skillGroups = [
  {
    id: "front-end",
    label: "Front end",
    skills: [
      { icon: "react", name: "React", context: "Component architecture for dashboards and marketing sites" },
      { icon: "nextjs", name: "Next.js", context: "App Router, server components, and static generation" },
      { icon: "typescript", name: "TypeScript", context: "Strict mode across every project, no implicit any" },
      { icon: "javascript", name: "JavaScript", context: "The runtime underneath, including the parts TypeScript hides" },
      { icon: "tailwind", name: "Tailwind CSS", context: "Token-driven design systems rather than ad hoc utilities" },
      { icon: "shadcn", name: "shadcn/ui", context: "Radix primitives retuned to a project's own palette" },
      { icon: "react-hook-form", name: "React Hook Form", context: "Form state with validation shared client and server" },
      { name: "Accessibility", context: "WCAG AA audits, keyboard passes, and screen reader testing" },
    ],
  },
  {
    id: "back-end",
    label: "Back end",
    skills: [
      { icon: "nodejs", name: "Node.js", context: "REST APIs and background jobs behind React front ends" },
      { icon: "express", name: "Express.js", context: "Routing, middleware, and error handling for JSON APIs" },
      { name: "REST APIs", context: "Versioned endpoints with validation at every boundary" },
      { name: "Server Actions", context: "Form handling without a separate API layer" },
      { icon: "zod", name: "Zod", context: "One schema validating a payload on both sides of the wire" },
      { name: "Authentication", context: "Session handling and role-based access control" },
    ],
  },
  {
    id: "data",
    label: "Data",
    skills: [
      { icon: "postgresql", name: "PostgreSQL", context: "Schema design, indexing, and migrations for relational domains" },
      { icon: "mongodb", name: "MongoDB", context: "Document modelling where the shape genuinely varies" },
      { icon: "supabase", name: "Supabase", context: "Postgres with auth and row level security already wired" },
      { icon: "neon", name: "Neon", context: "Serverless Postgres with branching for preview environments" },
      { icon: "prisma", name: "Prisma", context: "Typed queries and migration history on relational schemas" },
      { icon: "drizzle", name: "Drizzle", context: "SQL-first typed queries where the generated client is too much" },
      { name: "Audit logging", context: "Append-only trails for products that must show who did what" },
    ],
  },
  {
    id: "tooling",
    label: "Tooling",
    skills: [
      { icon: "git", name: "Git", context: "Small reviewable pull requests, linear history" },
      { icon: "docker", name: "Docker", context: "Reproducible local environments and parity with deployment" },
      { icon: "github-actions", name: "GitHub Actions", context: "Typecheck, test, and build on every pull request" },
      { icon: "vitest", name: "Vitest", context: "Unit coverage on logic where a wrong answer is possible" },
      { name: "Playwright", context: "Browser verification of real user flows" },
      { icon: "vercel", name: "Vercel", context: "Preview deployments per branch, production on merge" },
    ],
  },
  {
    id: "practices",
    label: "Practices",
    skills: [
      { name: "Performance budgets", context: "Core Web Vitals treated as a build gate, not a goal" },
      { name: "Design fidelity", context: "Side-by-side review against the source file before handover" },
      { name: "Written handover", context: "Architecture notes and setup steps the next developer can follow" },
    ],
  },
] as const satisfies readonly SkillGroup[];
