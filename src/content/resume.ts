import type { Resume } from "@/types/content";

/* The same history as `experience.ts` and `projects.ts`, told to an employer
   instead of a client. Nothing here is new information: every line restates a
   claim the content layer already makes, and its source is noted where it is
   not obvious.

   - "3+ years" counts freelance work since 2023-08 (`experience.ts`). Not
     "5+": that would need the training year and more besides.
   - 357 server tests, 39 suites, 739 frontend tests, the non-superuser RLS
     test, the boot guard, the concurrent booking and the replayed webhook are
     the TravelGrid Africa metrics' own evidence in `projects.ts`.
   - Better Auth, role-based access, Paystack, HMAC webhook verification and
     the CI run against Postgres come from those entries in `skills.ts`.
   - The Lighthouse and axe results are the site's own metrics in
     `projects.ts`. Its LCP figure is left out: it was measured before the
     hero changed, so it is due a re-measure.

   Highlights lead with a verb and carry no first person. Dates come from the
   roles, the stacks from the projects, so neither can drift from the rest of
   the site. */
export const resume = {
  title: "Full-Stack Software Engineer",

  summary:
    "Full-Stack Software Engineer with 3+ years of professional experience building production web applications, APIs and data-driven platforms. Experienced across React, Next.js, TypeScript, Node.js, Ruby on Rails and PostgreSQL, with hands-on delivery of multi-tenant systems, payment workflows, authentication, database security and automated testing. Based in Wellington, New Zealand.",

  experience: [
    {
      roleId: "independent",
      title: "Full-Stack Software Engineer",
      organisation: "Independent / Freelance",
      location: "Wellington, New Zealand",
      highlights: [
        "Design and deliver production web applications end to end, covering frontend architecture, backend APIs, relational databases, authentication, payments, testing and deployment.",
        "Built a multi-tenant travel commerce platform for flight, hotel and car bookings, with tenant isolation enforced by PostgreSQL Row-Level Security.",
        "Implemented wallet and booking workflows on an append-only ledger with atomic database transactions, keeping balances correct under concurrent bookings and replayed payment webhooks.",
        "Integrated session authentication, role-based access control, Paystack payments and HMAC-verified webhooks on the same platform.",
        "Built responsive business websites and internal dashboards with Next.js, React and TypeScript, taking each from design to production and handing over the codebase.",
        "Maintained 357 automated server tests on the travel platform, run against a real PostgreSQL database in GitHub Actions CI.",
      ],
      technologies: [
        "Next.js",
        "React",
        "TypeScript",
        "Node.js",
        "Express.js",
        "PostgreSQL",
        "Drizzle",
        "Paystack",
        "Docker",
        "Vercel",
      ],
    },
  ],

  development: [
    {
      roleId: "microverse",
      title: "Full-Stack Web Development Program",
      organisation: "Microverse",
      location: "Remote",
      highlights: [
        "Completed 1,500+ hours of full-time training in algorithms, data structures and full-stack development with JavaScript, React, Redux, Ruby and Ruby on Rails.",
        "Pair-programmed daily over GitHub with developers in other time zones, working with git-flow and daily stand-ups.",
        "Mentored junior developers in the program.",
      ],
      technologies: [],
    },
  ],

  projects: [
    {
      slug: "travelgrid-africa",
      subtitle: "Multi-Tenant Travel Commerce Platform",
      description:
        "Designed and developed a multi-tenant travel platform for flight, hotel and car booking, where agent and corporate organisations share one prepaid wallet.",
      highlights: [
        "Enforced organisation-level tenant isolation with PostgreSQL Row-Level Security, proved by a test that connects as a non-superuser role; the API refuses to boot in production if its role could bypass the policies.",
        "Designed atomic wallet debits on an append-only ledger: an insufficient balance rolls the inventory decrement back in the same transaction, and two concurrent bookings for one unit yield exactly one booking.",
        "Verified Paystack webhooks by HMAC-SHA512 and proved a replayed webhook cannot credit a wallet twice.",
        "Built 357 automated server tests across 39 suites, run against a real PostgreSQL database, alongside 739 frontend tests.",
      ],
    },
    {
      slug: "portfolio-site",
      name: "MohamedHNoor.com",
      subtitle: "Production Next.js Website",
      description:
        "Designed and developed a responsive production portfolio and business website with a typed content layer, accessible UI components, light and dark themes and statically generated routes.",
      highlights: [
        "Scored 100/100 for Lighthouse accessibility on a production build, with 0 axe violations across every route in both themes.",
        "Built content invariants that fail the build on malformed content, and a production deploy gate that refuses to ship placeholder projects, both covered by Vitest unit tests.",
      ],
    },
  ],
} as const satisfies Resume;
