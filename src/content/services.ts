import type { Service } from "@/types/content";

/* PLACEHOLDER CONTENT: scope and deliverables are illustrative and should be
   tightened to what you actually offer. No prices anywhere, by design. */
export const services = [
  {
    slug: "saas-platforms",
    name: "Healthcare and fintech platforms",
    forWho:
      "Technical founders and product leads building a regulated product on React, Node, and Postgres.",
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
          "Written architecture notes, environment setup, and a walkthrough with whoever maintains it next.",
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
      "A finished design file becomes a responsive, accessible Next.js site that matches the design, loads fast on a mid-range phone, and is straightforward to edit afterwards.",
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
    ],
    order: 1,
  },
] as const satisfies readonly Service[];
