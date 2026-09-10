import type { Service } from "@/types/content";

/* No prices anywhere, by design.
 *
 * Two kinds of statement live in this file and they carry different weight.
 *
 * `deliverables` describe what a client receives, and each one is backed by
 * work in `projects.ts`: the accessibility, Core Web Vitals and typed-content
 * claims by this site, and the access control, audit logging, Postgres
 * modelling and CI claims by the travel platform. Do not add a deliverable
 * there is no evidence of having done.
 *
 * `process` and `typicalTimeline` are promises about future engagements rather
 * than claims about past ones, which is why they are allowed to describe
 * intent. They still have to be true in the sense that matters: a client who
 * takes them literally on the first engagement is owed exactly what they say.
 * Change them if the way you actually work changes. */
export const services = [
  {
    slug: "saas-platforms",
    name: "SaaS Platforms",
    forWho:
      "Technical founders and product leads building a product on React, Node and Postgres where the data matters.",
    summary:
      "Front end and API work for products handling sensitive data, where access control, auditability, and a real testing story are requirements rather than nice-to-haves.",
    deliverables: [
      "React and Next.js front end against your design system",
      "Node API endpoints with input validation at every boundary",
      "Postgres data modelling and migrations",
      "Role-based access control and audit logging",
      "Handling rules for personal and health data, documented",
      "Test coverage on the logic that matters, wired into CI",
    ],
    typicalTimeline: "Four to twelve weeks, depending on scope",
    process: [
      {
        title: "Model the domain",
        detail:
          "Agree the entities, the roles, and who is allowed to see what, before any screen is built.",
      },
      {
        title: "Thin slice first",
        detail:
          "One real flow end to end, from database to interface, so the architecture is proven early rather than assumed.",
      },
      {
        title: "Build in reviewable pieces",
        detail:
          "Small pull requests against a running staging environment, each one demonstrable.",
      },
      {
        title: "Hand over",
        detail:
          "Architecture notes, environment setup, and a walkthrough with whoever maintains it next. The codebase is yours, which is how every engagement I have taken has ended.",
      },
    ],
    order: 2,
  },
  {
    slug: "figma-to-nextjs",
    name: "Figma to production Next.js",
    forWho:
      "Founders, designers, and small agencies with a finished design file and no front-end capacity.",
    summary:
      "A finished design file becomes a pixel-accurate, fully responsive Next.js site that matches the file at every breakpoint, loads fast on a mid-range phone, and is straightforward to edit afterwards.",
    deliverables: [
      "Pixel-accurate build of every screen and state in the file",
      "Responsive behaviour at mobile, tablet, and desktop",
      "Accessible markup: landmarks, heading order, keyboard operation, AA contrast",
      "Core Web Vitals within target on mobile",
      "A typed content layer so copy changes need no code changes",
      "Deployment plus a short handover walkthrough",
    ],
    typicalTimeline: "One to three weeks for a typical marketing site",
    process: [
      {
        title: "Read the file",
        detail:
          "Walk the design and list every screen, state, and breakpoint, including the ones the file implies but does not draw.",
      },
      {
        title: "Build the system first",
        detail:
          "Tokens, typography, and shared components before pages, so the site stays consistent as it grows.",
      },
      {
        title: "Screen by screen",
        detail:
          "Each screen goes to a staging URL as it lands, so you review the real thing rather than a screenshot.",
      },
      {
        title: "Fidelity and performance pass",
        detail:
          "Side-by-side check against the design, then Lighthouse and a keyboard pass before handover.",
      },
      {
        title: "Yours to keep",
        detail:
          "The codebase is handed over on delivery. Every engagement I have taken has ended that way, so nothing you paid for depends on me still being around.",
      },
    ],
    order: 1,
  },
] as const satisfies readonly Service[];
