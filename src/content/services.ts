import type { Service } from "@/types/content";

/* No prices anywhere, by design.
 *
 * Two kinds of statement live in this file and they carry different weight.
 *
 * `deliverables` describe what a client receives, and each one is backed by
 * work in `projects.ts`: the design fidelity, accessibility, Core Web Vitals
 * and typed-content claims by this site, and the authentication, tenant
 * isolation, payments, Postgres modelling, CI and deployment claims by the
 * travel platform. Do not add a deliverable there is no evidence of having
 * done.
 *
 * `process` and `typicalTimeline` are promises about future engagements rather
 * than claims about past ones, which is why they are allowed to describe
 * intent. They still have to be true in the sense that matters: a client who
 * takes them literally on the first engagement is owed exactly what they say.
 * Change them if the way you actually work changes.
 *
 * The white-label terms on the agency track are process, not deliverables, for
 * that reason. No agency engagement is in `projects.ts` yet, so the track
 * claims the build standard this site proves and promises the terms: the
 * agency's name on the work, and the client relationship left with the agency. */
export const services = [
  {
    slug: "startup-saas",
    name: "SaaS for startups",
    forWho:
      "Founders and early product teams taking a SaaS from idea or prototype to its first paying customers, on a stack their first engineering hire will already know.",
    summary:
      "Full-stack product work from first schema to launch, with the parts that are expensive to retrofit, such as authentication, tenant isolation, payments and tests, built in from the start rather than bolted on after the first customers arrive.",
    deliverables: [
      "React and Next.js front end against your design or design system",
      "Node API endpoints with input validation at every boundary",
      "Postgres data modelling and migrations",
      "Authentication, roles, and isolation between customer accounts",
      "Payment provider integration with verified webhooks",
      "Test coverage on the logic that matters, wired into CI",
      "Production deployment to managed hosting, as one container or on Vercel",
    ],
    typicalTimeline: "Four to twelve weeks to a first launch, depending on scope",
    process: [
      {
        title: "Cut to the launch",
        detail:
          "Agree what the first version has to do for a paying customer, and write down what waits, so the scope is a decision rather than a drift.",
      },
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
          "Architecture notes, environment setup, and a walkthrough with whoever maintains it next, including your first engineering hire. The codebase is yours, which is how every engagement I have taken has ended.",
      },
    ],
    order: 2,
  },
  {
    slug: "agency-builds",
    name: "White-label for agencies",
    forWho:
      "Design and digital agencies with signed work, a finished design, and more projects than developers to build them.",
    summary:
      "Your team keeps the client and the credit. I build the site or web app from your design, inside your process, so it reaches your client matched to the file, fast on a mid-range phone, and accessible.",
    deliverables: [
      "Next.js marketing sites and React web apps, built from your design files",
      "A match to the file at mobile, tablet, and desktop, including the states it implies but does not draw",
      "Accessible markup and AA contrast, checked with a keyboard pass before handover",
      "Core Web Vitals within target on mobile",
      "Typed, readable code your own developers can maintain after handover",
      "Deployment to your hosting, plus a handover walkthrough for your team",
    ],
    typicalTimeline: "One to three weeks for a typical site, longer for a web app",
    process: [
      {
        title: "Brief from your team",
        detail:
          "You own the client relationship. I take the brief and the design from your team and bring questions back to you, so your client hears one voice.",
      },
      {
        title: "Work inside your process",
        detail:
          "Your repository, your project board and your review habits, rather than a new set of tools for your team to learn.",
      },
      {
        title: "Gaps found early",
        detail:
          "Every screen, state and breakpoint the design implies but does not draw is listed back to you before the build starts, so the questions reach you before they reach your client.",
      },
      {
        title: "Reviewable as it lands",
        detail:
          "Each screen goes to a staging URL as it is built, for you to check, and to show your client when you are ready to.",
      },
      {
        title: "Handed over under your name",
        detail:
          "The code goes into your repository on delivery, with no credit line or link back to me. Every engagement I have taken has ended with a handover, so nothing your client paid for depends on me still being around.",
      },
    ],
    order: 1,
  },
  {
    slug: "figma-to-nextjs",
    name: "Figma to production Next.js",
    forWho:
      "Founders, designers, and marketing teams with a finished design file and no front-end capacity.",
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
    order: 3,
  },
] as const satisfies readonly Service[];
