import type { Role } from "@/types/content";

/* Real history. The two "Example" companies that used to sit here were seeded
   placeholders and are gone: an invented work history is the one thing on this
   site that cannot be walked back.

   This is deliberately short. A year of full-time training, then freelance
   delivery from the month it ended, is the whole of it, and two true entries
   are worth more than a padded timeline. The proof of capability lives in `projects.ts`, which is
   where a buyer with no reviews to read actually looks. */
export const roles = [
  {
    id: "independent",
    company: "Independent",
    title: "Freelance software engineer",
    start: "2023-08",
    end: "present",
    summary:
      "Direct client work, from marketing sites and internal dashboards to a multi-tenant platform handling payments and tenant-isolated data.",
    impact: [
      "Delivered a wallet-first travel commerce platform with an append-only ledger, atomic booking debits and tenant isolation enforced in Postgres",
      "Built dashboards and landing pages for small businesses, each taken from design to production",
      "Handed the codebase over on every engagement, so nothing a client paid for depended on me staying",
    ],
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Node.js",
      "Express.js",
      "PostgreSQL",
      "Tailwind CSS",
    ],
  },
  {
    id: "microverse",
    company: "Microverse",
    title: "Remote Full-stack Web Development Program",
    start: "2022-08",
    end: "2023-07",
    summary:
      "1500+ hours on algorithms, data structures and full-stack development, built around real projects and remote pair programming with developers in other timezones.",
    impact: [
      "Paired daily over GitHub with git-flow and stand-ups, collaborating with developers around the world",
      "Mentored junior developers in the program",
      "Shipped real projects rather than exercises, in JavaScript, React, Redux, Ruby and Ruby on Rails",
    ],
    stack: ["JavaScript", "React", "Redux", "Ruby", "Ruby on Rails", "Git"],
  },
] as const satisfies readonly Role[];
