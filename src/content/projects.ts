import type { Project } from "@/types/content";

/* Real work only. Every entry here carries `isPlaceholder: false`, and the
   deploy gate in `src/lib/deploy-readiness.ts` refuses a production build if
   that ever stops being true, so a seeded example cannot reach a buyer.

   Self-initiated builds and spec work count as real entries, provided the case
   study says so. TravelGrid is client work; this site is obviously its own.
   Array order is the canonical order for the whole site: the home section, the
   index, the sitemap, and the previous and next links on a case study all read
   it. */
export const projects = [
  {
    slug: "travelgrid-africa",
    title: "Multi-tenant travel platform with an auditable wallet",
    summary:
      "A wallet-first travel commerce platform for flights, hotels and cars, where agent and corporate organisations share one prepaid balance and every debit has to be correct under concurrency, replay and rollback.",
    role: "Sole developer",
    period: "2026",
    category: "saas-platforms",
    stack: [
      "Node.js",
      "TypeScript",
      "Express.js",
      "PostgreSQL",
      "Drizzle",
      "React",
      "Vite",
      "Docker",
    ],
    featured: true,
    isPlaceholder: false,
    links: {},
    metrics: [
      {
        label: "Server tests",
        value: "234",
        evidence:
          "Across 27 suites. The financial set proves webhook replay cannot double-credit, and that two concurrent bookings against one unit of inventory yield exactly one booking.",
      },
      {
        label: "Tenant isolation",
        value: "Postgres RLS",
        evidence:
          "rlsIsolation.test.ts connects as a dedicated non-superuser role and proves a forgotten filter still cannot return another tenant's rows.",
      },
      {
        label: "Wallet debits",
        value: "Atomic",
        evidence:
          "An insufficient balance rolls the inventory decrement back in the same transaction, proved in the integration suite rather than asserted.",
      },
    ],
    cover: {
      src: "/projects/travelgrid-africa.webp",
      alt: "The TravelGrid Africa home page: a dark blue hero reading Explore Africa, Travel Smarter, above a white search panel with tabs for flights, hotels and cars and fields for origin, destination, dates, passengers and cabin class.",
      width: 1200,
      height: 750,
    },
    caseStudy: [
      {
        heading: "Problem",
        body: [
          "Travel agents and corporate travel desks do not buy the way a consumer does. They top a balance up once and draw against it all month, several people book on the same account, and an agent earns commission on what they sell. That turns a booking flow into a financial system: money moves before inventory is confirmed, two people can book the last seat at the same moment, and a payment provider will happily deliver the same webhook twice.",
        ],
      },
      {
        heading: "Approach",
        body: [
          "Financial correctness came first and was written as tests before it was written as features. The rules that matter are not visible in a screenshot, so they are pinned by an integration suite that provokes the failure rather than assuming it cannot happen.",
          "Provider integration was designed as a seam from the start. The normalised flight, hotel and vehicle models mirror the shapes the real GDS APIs return, so wiring live Amadeus and Travelport is a change below the seam and nothing above it moves. The mock provider serves deterministic content over real inventory, which is what makes the concurrency tests meaningful.",
        ],
        bullets: [
          "Webhook replay proved unable to double-credit or double-confirm",
          "Two concurrent bookings against one unit of inventory yield exactly one booking",
          "Commission rates snapshot at sale, so a later rate change cannot rewrite history",
          "Tenant isolation tested from a non-superuser connection, where RLS actually applies",
        ],
      },
      {
        heading: "Architecture",
        body: [
          "Folders are layers and a filename carries its role, so one resource reads as a matching set: adminRouter, adminController, adminService, adminValidators. Controllers stay thin, moving a request to a service and back with no business logic and no database access. Services own the business rules and every transaction boundary. Repositories hold Drizzle queries only, including the conditional updates that make an inventory decrement and a wallet debit atomic.",
          "Tenant isolation is enforced twice. The application layer scopes every query, and a request-pinned connection sets the RLS session variables so Postgres refuses cross-tenant rows even if a filter is forgotten. A boot-time check verifies the policies are actually on rather than trusting that a migration ran.",
        ],
        bullets: [
          "Append-only ledger with database constraints as the backstop, not the plan A",
          "Short-lived bearer token in memory, rotating refresh token in an httpOnly cookie, no credential in localStorage",
          "Paystack webhooks verified by HMAC-SHA512 before anything is trusted",
          "One Docker image for server and built client; stateless, pointed at managed Postgres",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "234 server tests across 27 suites, with the financial and multitenancy behaviour proved rather than described: replay safety, booking atomicity under concurrency, commission immutability, and cross-tenant reads blocked at the database.",
          "CI runs lint, typecheck, test and build against a real postgres:16 container on every push, and all four have to pass. The platform runs today as a single container on Railway.",
        ],
      },
    ],
  },
  {
    slug: "portfolio-site",
    title: "Design reference to production portfolio",
    summary:
      "This site. Built from a design reference to a measured accessibility and performance standard, with the parts of the reference that would have been dishonest deliberately removed.",
    role: "Sole developer",
    period: "2026",
    category: "figma-to-nextjs",
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "shadcn/ui",
      "Motion",
      "Vitest",
    ],
    featured: true,
    isPlaceholder: false,
    links: {},
    metrics: [
      {
        label: "Lighthouse accessibility",
        value: "100/100",
        evidence:
          "Mobile preset against a production build, scored on the home page, a case study and the contact form.",
      },
      {
        label: "axe violations",
        value: "0",
        evidence:
          "Every route in both themes, including the mobile menu open and the contact form showing its errors.",
      },
      {
        label: "Largest Contentful Paint",
        value: "108 ms",
        evidence:
          "Measured in a real browser at mobile viewport, with cumulative layout shift at 0.",
      },
    ],
    cover: {
      src: "/projects/portfolio-site.webp",
      alt: "This site's home page in its dark theme: the headline Figma files in, Production Next.js out, beside a code-editor card listing the developer's tracks and stack, above a row of technology chips.",
      width: 1200,
      height: 750,
    },
    caseStudy: [
      {
        heading: "Problem",
        body: [
          "A developer with no reviews has to win work on evidence alone, and most portfolios actively work against that. They lead with a generic tagline, rate their own skills with percentage bars, and show screenshots with no account of what was solved. A client cannot tell a capable developer from a template.",
          "The reference design I started from had that problem built in. It carried a client-count statistic and a satisfaction score, neither of which could be true for an account with no completed jobs, and skill bars that are self-assigned by definition.",
        ],
      },
      {
        heading: "Approach",
        body: [
          "I matched the reference where it was good and departed from it where it would have made the site lie. The palette, the hero composition, the eyebrow-and-heading rhythm and the card language were kept. The invented statistics and the skill percentages came out and were replaced with numbers that carry the measurement behind them.",
          "Because accessibility and performance are services this site sells, they were treated as build gates rather than aspirations. Contrast is not reviewed by eye; it is a test that converts every theme token from oklch to sRGB and fails the build if a pair drops below its WCAG threshold.",
        ],
        bullets: [
          "Every proof point on the site names the measurement it came from",
          "Colour contrast is a test, asserted across fourteen token pairs in both themes",
          "A production build is refused while any project is still seeded example content",
          "The design reference was followed, not copied: three elements were removed on purpose",
        ],
      },
      {
        heading: "Architecture",
        body: [
          "Next.js App Router with server components throughout. Every route is statically generated and the only server work is the contact form's Server Action, which re-validates with the same Zod schema the browser used rather than trusting what arrived.",
          "All copy lives in typed content modules with invariants checked at module scope, so a malformed entry fails the build instead of rendering an empty section. Client components are limited to the five islands that genuinely need them: the theme toggle, mobile navigation, contact form, project filter, and the marquee's pause control.",
        ],
        bullets: [
          "Static generation for every route, verified in the build output",
          "Security headers including a Content Security Policy, served without middleware so routes stay static",
          "Social images generated at build time from the content layer",
          "297 tests over the logic that can be wrong: validation, contrast, metadata, structured data",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "Lighthouse accessibility, best practices and SEO all score 100 on the mobile preset, axe reports no violations on any route in either theme, and layout shift is zero.",
          "Performance measured 92 to 97 on the same runs, which is below the 95 target on two of the three routes. The cause is recorded rather than glossed: with simulated Slow 4G, roughly 425 KB of critical path costs about 2.9 seconds of render delay, while the same page reaches its largest contentful paint in 108 ms on a real connection. Reporting only the flattering half of that would undercut the point of the site.",
        ],
      },
    ],
  },
] as const satisfies readonly Project[];
