import type { Project } from "@/types/content";

/* PLACEHOLDER CONTENT. Every project here is fictional and carries
   `isPlaceholder: true`. "Example" company names follow the reserved-example
   convention so none can be mistaken for a real client. Feature 13 blocks the
   deploy while any project is still flagged.

   Self-initiated builds and spec work count as real entries, provided the case
   study says so. Array order is the canonical order for the whole site. */
export const projects = [
  {
    slug: "example-studio-marketing-site",
    title: "Design file to production marketing site",
    summary:
      "A finished Figma file for a six-page marketing site, built as a responsive Next.js application with a typed content layer the client edits without touching code.",
    role: "Sole developer",
    period: "2025",
    category: "figma-to-nextjs",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    featured: true,
    isPlaceholder: true,
    links: {},
    metrics: [
      {
        label: "Lighthouse performance",
        value: "98",
        evidence: "Mobile preset, run against the deployed home page",
      },
      {
        label: "Largest Contentful Paint",
        value: "1.4s",
        evidence: "Mobile throttled, measured on the deployed site",
      },
      {
        label: "Design fidelity",
        value: "Every screen and state",
        evidence: "Side-by-side review against the source file before handover",
      },
    ],
    cover: {
      src: "/projects/example-studio-marketing-site.png",
      /* Empty on purpose: a plain gradient panel conveys nothing and the
         adjacent title already names the project. Real screenshots must carry
         descriptive alt text. */
      alt: "",
      width: 1200,
      height: 750,
    },
    caseStudy: [
      {
        heading: "Problem",
        body: [
          "The client had a finished design file and no front-end capacity. Two previous quotes had proposed rebuilding the design in a page builder, which would have lost the typography and spacing the designer had spent weeks on.",
          "They also needed to edit copy after launch without booking developer time, and had been burned before by a site only its original author could change.",
        ],
      },
      {
        heading: "Approach",
        body: [
          "I read the whole file first and listed every screen, state, and breakpoint, including the ones the design implied but did not draw, such as empty states and long-name overflow. That list became the scope, agreed before any code.",
          "The token layer was built before any page, so spacing, colour, and type came from one place and stayed consistent as the site grew.",
        ],
        bullets: [
          "Every screen and state enumerated before the build started",
          "Design tokens ported first, pages second",
          "Each page reviewed on a staging URL as it landed",
        ],
      },
      {
        heading: "Architecture",
        body: [
          "Next.js App Router with server components throughout, so the client bundle carried only the two interactive islands the design actually needed.",
          "All copy lives in typed content modules, which means a wrong field fails the build rather than rendering an empty section.",
        ],
        bullets: [
          "Static generation for every route",
          "Typed content modules instead of a CMS, given the page count",
          "Two client components: the mobile menu and the contact form",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "The site matched the design at every breakpoint and scored 98 on mobile Lighthouse performance.",
          "The client has since made several copy changes themselves by editing the content modules, which was the point.",
        ],
      },
    ],
  },
  {
    slug: "example-health-platform",
    title: "Clinician-facing records platform",
    summary:
      "Role-aware interfaces for a patient records product, where what a user can see depends on their relationship to the record and every read is auditable.",
    role: "Front end and API",
    period: "2024 to 2025",
    category: "saas-platforms",
    stack: ["React", "Next.js", "Node.js", "PostgreSQL", "TypeScript"],
    featured: true,
    isPlaceholder: true,
    links: {},
    metrics: [
      {
        label: "Access rules",
        value: "Enforced server-side",
        evidence: "Every query scoped in the repository layer, not in the view",
      },
      {
        label: "Audit coverage",
        value: "Every record read",
        evidence: "Append-only log written in the same transaction as the read",
      },
      {
        label: "Test coverage",
        value: "All authorization logic",
        evidence: "Unit tests on the permission resolver, run in CI",
      },
    ],
    cover: {
      src: "/projects/example-health-platform.png",
      alt: "",
      width: 1200,
      height: 750,
    },
    caseStudy: [
      {
        heading: "Problem",
        body: [
          "Clinicians needed a fast view of a patient record, but not every clinician was allowed to see every field, and the rules depended on the viewer's relationship to the patient rather than on a flat role.",
          "The existing prototype resolved permissions in the interface, which meant the API would return data the screen then chose to hide. Anyone reading the network tab could see everything.",
        ],
      },
      {
        heading: "Approach",
        body: [
          "Permission resolution moved to the server and into the data layer. The API cannot return a field the viewer is not entitled to, so the interface never has to be trusted to hide anything.",
          "The rules were written down and turned into unit tests before the screens were built, so the edge cases were argued about while they were still cheap to change.",
        ],
        bullets: [
          "Authorization resolved in the repository layer, never in a component",
          "Rules captured as tests before any interface work",
          "Deny by default: a new field is invisible until a rule grants it",
        ],
      },
      {
        heading: "Architecture",
        body: [
          "Next.js front end against a Node API over Postgres. Every query is scoped by the viewer at the point of access, so there is no code path that can forget.",
          "Reads and writes to a record append to an audit table inside the same transaction, which means a successful read cannot exist without its log entry.",
        ],
        bullets: [
          "Postgres row scoping applied in one place",
          "Audit writes share the transaction with the operation they record",
          "Personal data kept out of logs and error reports",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "The team could answer who had seen a record and when, which they could not do before.",
          "Adding a new field became a two-line rule change plus a test, rather than an audit of every screen that might display it.",
        ],
      },
    ],
  },
  {
    slug: "example-finance-dashboard",
    title: "Reconciliation dashboard",
    summary:
      "A dashboard for spotting and resolving mismatches between two ledgers, built so an operator can see the discrepancy and the evidence for it on one screen.",
    role: "Sole developer",
    period: "2024",
    category: "saas-platforms",
    stack: ["React", "Next.js", "Node.js", "PostgreSQL"],
    featured: true,
    isPlaceholder: true,
    links: {},
    metrics: [
      {
        label: "Reconciliation run",
        value: "Under 30 seconds",
        evidence: "Measured on a day of production-scale transaction volume",
      },
      {
        label: "Money handling",
        value: "Integer minor units",
        evidence: "No floating point anywhere in the calculation path",
      },
      {
        label: "Repeat runs",
        value: "Idempotent",
        evidence: "Re-running a completed day produces no duplicate entries",
      },
    ],
    cover: {
      src: "/projects/example-finance-dashboard.png",
      alt: "",
      width: 1200,
      height: 750,
    },
    caseStudy: [
      {
        heading: "Problem",
        body: [
          "Two systems recorded the same transactions and disagreed often enough that someone was reconciling them by hand in a spreadsheet each morning.",
          "The manual process took hours, and because it produced no record of the reasoning, the same mismatch was investigated repeatedly.",
        ],
      },
      {
        heading: "Approach",
        body: [
          "The matching rules came first, written as pure functions with tests covering the awkward cases: partial matches, same-amount duplicates on one day, and entries arriving out of order.",
          "The interface was built around the operator's actual question, which was not whether a mismatch existed but why, so each discrepancy shows both sides and the rule that failed.",
        ],
        bullets: [
          "Matching logic as pure, tested functions before any interface",
          "Every amount handled as integer minor units",
          "Each resolution stores who decided it and on what basis",
        ],
      },
      {
        heading: "Architecture",
        body: [
          "A scheduled Node job pulls both ledgers, runs the matcher, and writes results to Postgres. The dashboard reads those results and never recomputes on request.",
          "Runs are keyed by date and source so a repeat run replaces its own results rather than appending duplicates.",
        ],
        bullets: [
          "Matching separated from both fetching and rendering",
          "Idempotency keyed on date and source",
          "Resolutions append to a history rather than overwriting",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "The morning reconciliation went from hours of spreadsheet work to reviewing a short queue of genuine exceptions.",
          "Because each resolution recorded its reasoning, recurring mismatches were traced to their source instead of being re-investigated.",
        ],
      },
    ],
  },
] as const satisfies readonly Project[];
