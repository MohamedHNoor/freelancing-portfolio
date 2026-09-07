import type { SkillGroup } from "@/types/content";

/* PLACEHOLDER CONTENT: replace each `context` with where you actually used the
   technology. Context is the whole point of this section, and a vague one is
   worth less than omitting the entry.

   `icon` is deliberately unset everywhere. It is a key into
   `src/components/icons/`, which feature 5 populates; seeding keys now would
   point at components that do not exist. */
export const skillGroups = [
  {
    id: "front-end",
    label: "Front end",
    skills: [
      {
        name: "React",
        context: "Component architecture for dashboards and marketing sites",
      },
      {
        name: "Next.js",
        context: "App Router, server components, and static generation",
      },
      {
        name: "TypeScript",
        context: "Strict mode across every project, no implicit any",
      },
      {
        name: "Tailwind CSS",
        context: "Token-driven design systems rather than ad hoc utilities",
      },
      {
        name: "Accessibility",
        context: "WCAG AA audits, keyboard passes, and screen reader testing",
      },
    ],
  },
  {
    id: "back-end",
    label: "Back end",
    skills: [
      {
        name: "Node.js",
        context: "REST APIs and background jobs behind React front ends",
      },
      {
        name: "Server Actions",
        context: "Form handling with validation shared between client and server",
      },
      {
        name: "Zod",
        context: "One schema validating a payload on both sides of the wire",
      },
      {
        name: "Authentication",
        context: "Session handling and role-based access control",
      },
    ],
  },
  {
    id: "data",
    label: "Data",
    skills: [
      {
        name: "PostgreSQL",
        context: "Schema design, indexing, and migrations for relational domains",
      },
      {
        name: "Data modelling",
        context: "Mapping a regulated domain to tables people can reason about",
      },
      {
        name: "Audit logging",
        context: "Append-only trails for products that must show who did what",
      },
    ],
  },
  {
    id: "tooling",
    label: "Tooling",
    skills: [
      { name: "Git", context: "Small reviewable pull requests, linear history" },
      { name: "Vitest", context: "Unit coverage on logic where a wrong answer is possible" },
      { name: "Playwright", context: "Browser verification of real user flows" },
      { name: "GitHub Actions", context: "Typecheck, test, and build on every pull request" },
    ],
  },
  {
    id: "practices",
    label: "Practices",
    skills: [
      {
        name: "Performance budgets",
        context: "Core Web Vitals treated as a build gate, not a goal",
      },
      {
        name: "Design fidelity",
        context: "Side-by-side review against the source file before handover",
      },
      {
        name: "Written handover",
        context: "Architecture notes and setup steps the next developer can follow",
      },
    ],
  },
] as const satisfies readonly SkillGroup[];
