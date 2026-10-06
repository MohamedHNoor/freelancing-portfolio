import type { Project } from "@/types/content";

/* Real work only. Every entry here carries `isPlaceholder: false`, and the
   deploy gate in `src/lib/deploy-readiness.ts` refuses a production build if
   that ever stops being true, so a seeded example cannot reach a buyer.

   Every number names the measurement behind it, and is re-checked against the
   project's repository and test suites rather than carried forward.

   Array order is the canonical order for the whole site: the home section, the
   index, the sitemap, and the previous and next links on a case study all read
   it. */
export const projects = [
  {
    slug: "travelgrid-africa",
    name: "TravelGrid Africa",
    title: "Travel Commerce Platform",
    summary:
      "A multi-tenant travel platform designed around flight, hotel and car booking workflows, where agent and corporate organisations share one prepaid wallet and every debit has to be correct under concurrency, replay and rollback.",
    role: "Sole developer",
    period: "2026",
    category: "saas-development",
    stack: [
      "TypeScript",
      "Node.js",
      "Express.js",
      "PostgreSQL",
      "Drizzle",
      "Next.js",
      "React",
      "Better Auth",
      "Paystack",
      "Docker",
    ],
    featured: true,
    isPlaceholder: false,
    links: {},
    metrics: [
      {
        label: "Automated server tests",
        value: "357",
        evidence:
          "Across 39 suites, run against a real Postgres database on 5 October 2026, alongside 739 frontend tests. The financial set proves webhook replay cannot double-credit, and two concurrent bookings against one unit of inventory yield exactly one booking.",
      },
      {
        label: "Tenant isolation",
        value: "Postgres RLS",
        evidence:
          "rlsIsolation.test.ts connects as a dedicated non-superuser role and proves a forgotten filter still cannot return another tenant's rows. The API refuses to boot in production if its role would bypass the policies.",
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
        heading: "Overview",
        body: [
          "TravelGrid Africa is a wallet-first travel commerce platform for flights, hotels and cars. Guests and customers book and pay at checkout. Travel agents and corporate travel desks join as organisations that share one prepaid wallet, invite their own members, and, for agents, earn commission on what they sell. An admin console runs the platform.",
        ],
      },
      {
        heading: "The Problem",
        body: [
          "Travel agents and corporate travel desks do not buy the way a consumer does. They top a balance up once and draw against it all month, several people book on the same account, and an agent earns commission on what they sell. That turns a booking flow into a financial system: money moves before inventory is confirmed, two people can book the last seat at the same moment, and a payment provider will happily deliver the same webhook twice.",
        ],
      },
      {
        heading: "The Solution",
        body: [
          "The platform treats a booking as a financial transaction first. An organisation's wallet sits on an append-only ledger, inventory and the wallet debit move together in one database transaction, and payment webhooks are verified and replay-safe before anything is credited or confirmed.",
          "Provider integration was designed as a seam from the start. The normalised flight, hotel and vehicle models mirror the shapes the real GDS APIs return, Amadeus offers for flights and hotels and Travelport for vehicles, so wiring the live providers changes nothing above the seam.",
        ],
      },
      {
        heading: "Key Features",
        body: [
          "Everything a guest, an organisation and an operator needs to book, pay, and keep the books straight.",
        ],
        bullets: [
          "Flight, hotel and car search and booking, including round-trip flights",
          "Guest checkout through Paystack, with self-service by secure link for e-tickets, invoices and cancellation",
          "Organisation wallets shared across members, with single-use, email-bound invites",
          "Agent commission, with the rate snapshotted at sale",
          "Invoices and e-tickets as PDFs, and notifications by email",
          "An admin console for bookings, refunds, organisations and their applications, wallets, commissions, audit logs and a failed-email, refund and webhook error queue",
        ],
      },
      {
        heading: "Architecture",
        body: [
          "Two services from two Docker images: an API on Node, TypeScript, Express 5 and Drizzle over Postgres, and a web app on Next.js 16 with the App Router. The web app calls the API on its own origin, and both are stateless.",
          "Folders are layers and a filename carries its role, so one resource reads as a matching set of router, controller, service and validators. Controllers stay thin. Services own the business rules and every transaction boundary. Repositories hold Drizzle queries only, including the conditional updates that make an inventory decrement and a wallet debit atomic.",
        ],
        bullets: [
          "Tenant isolation enforced twice: every query is scoped in the application, and a request-pinned connection carries the tenant into Postgres row-level security",
          "Better Auth sessions in an httpOnly, SameSite=Lax cookie, with optional Google sign-in and no credential in localStorage",
          "Paystack webhooks verified by HMAC-SHA512 before anything is trusted",
          "An append-only ledger, with database constraints as the backstop rather than the plan",
        ],
      },
      {
        heading: "Engineering Challenges",
        body: [
          "The hard parts are the ones a screenshot never shows, so each was handled where it cannot be forgotten: in a transaction, a constraint, or a test that provokes the failure.",
        ],
        bullets: [
          "Concurrency: two bookings racing for one unit of inventory must yield exactly one booking",
          "Payments and webhooks: a replayed webhook must never credit or confirm twice",
          "Data integrity: an insufficient balance rolls the inventory decrement back in the same transaction",
          "Multi-tenancy: Postgres exempts superusers from row-level security, so the API connects as a dedicated non-superuser role and refuses to boot in production if its role could bypass the policies",
          "Commission history: rates are snapshotted at sale, so a later rate change cannot rewrite what an agent earned",
          "Connection pinning: every authenticated request holds one pooled connection to carry its tenant, which makes the pool size a concurrency ceiling to plan for rather than a default",
        ],
      },
      {
        heading: "Testing",
        body: [
          "357 backend tests across 39 suites, with Vitest and Supertest against a real Postgres test database, and 739 frontend tests across 69 files with Testing Library. Both suites passed in full on 5 October 2026.",
          "CI runs lint, typecheck, test and build for both packages on every push, with the backend's integration suites running against a real postgres:16 service.",
        ],
        bullets: [
          "Webhook replay proved unable to double-credit or double-confirm",
          "Two concurrent bookings against one unit of inventory yield exactly one booking",
          "Commission rates proved immutable after sale, and commission approval idempotent",
          "Tenant isolation tested from a non-superuser connection, where row-level security actually applies",
        ],
      },
      {
        heading: "Technology",
        body: [
          "Chosen for a financial system that has to stay correct as it grows, and for a codebase another developer can pick up.",
        ],
        bullets: [
          "Backend: Node.js, TypeScript, Express 5, Zod",
          "Database: PostgreSQL with Drizzle ORM and drizzle-kit migrations",
          "Frontend: Next.js 16, React 19, Tailwind CSS, shadcn/ui, TanStack Query",
          "Authentication: Better Auth, with Google sign-in",
          "Payments: Paystack",
          "Email and storage: Resend, and Cloudinary for private documents behind signed, expiring links",
          "Infrastructure: Docker images on Railway, CI on GitHub Actions",
        ],
      },
      {
        heading: "My Role",
        body: [
          "Role: Sole developer. I was responsible for the architecture, frontend, backend, database, authentication, payment integration, testing and deployment.",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "Agents and corporate travel desks can book against one shared prepaid balance with every debit accounted for, guests can book and manage a trip without an account, and operators can see and correct the money from one console.",
          "The financial and multi-tenancy behaviour is proved rather than described, by 1,096 automated tests across the two packages, and the platform runs as two stateless services on Railway.",
        ],
      },
    ],
  },
  {
    slug: "portfolio-site",
    name: "mohamedhnoor.com",
    title: "Production Next.js Website",
    summary:
      "This site. A production website built from a design reference with a focus on accessibility, responsive behaviour and performance, with the parts of the reference that would have been dishonest deliberately removed.",
    role: "Sole developer",
    period: "2026",
    category: "figma-to-production",
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
        value: "88 ms",
        evidence:
          "The home page in a real browser at mobile viewport, against a production build on 5 October 2026, with cumulative layout shift at 0. Case studies and the contact page measured 76 ms.",
      },
    ],
    cover: {
      src: "/projects/portfolio-site.webp",
      alt: "This site's home page in its dark theme: the headline Websites and Web Applications Built for Your Business, with Start a Project and View My Work buttons, beside a code-editor card listing the four services and the stack, above a row of technology chips.",
      width: 1200,
      height: 750,
    },
    caseStudy: [
      {
        heading: "Overview",
        body: [
          "The website you are reading: a portfolio for a freelance developer, built from a design reference into a production Next.js site. It is also a work sample, so its own accessibility and performance numbers are published with the measurement behind them.",
        ],
      },
      {
        heading: "The Problem",
        body: [
          "A developer with no reviews has to win work on evidence alone, and most portfolios actively work against that. They lead with a generic tagline, rate their own skills with percentage bars, and show screenshots with no account of what was solved. A client cannot tell a capable developer from a template.",
          "The reference design I started from had that problem built in. It carried a client-count statistic and a satisfaction score, neither of which could be true for an account with no completed jobs, and skill bars that are self-assigned by definition.",
        ],
      },
      {
        heading: "The Solution",
        body: [
          "I matched the reference where it was good and departed from it where it would have made the site lie. The palette, the hero composition, the eyebrow-and-heading rhythm and the card language were kept. The invented statistics and the skill percentages came out and were replaced with numbers that carry the measurement behind them.",
          "Because accessibility and performance are services this site sells, they were treated as build gates rather than aspirations.",
        ],
      },
      {
        heading: "Key Features",
        body: [
          "A site a client can read on a phone in a minute, or study in depth before an enquiry.",
        ],
        bullets: [
          "A home page that summarises every section, with a full page behind each",
          "Case studies with the measurement behind every number",
          "A project index filterable by service and technology",
          "A print-optimised resume",
          "A contact form with the same validation in the browser and on the server, delivered by email",
          "Light and dark themes, generated social images and structured data",
        ],
      },
      {
        heading: "Architecture",
        body: [
          "Next.js App Router with server components throughout. Every public route is statically generated and the public site's only server work is the contact form's Server Action, which re-validates with the same Zod schema the browser used rather than trusting what arrived.",
          "All copy lives in typed content modules with invariants checked at module scope, so a malformed entry fails the build instead of rendering an empty section. Client components are limited to the islands that genuinely need them: the theme toggle, mobile navigation, contact form, project filter, and the marquee's pause control.",
        ],
        bullets: [
          "Static generation for every public route, verified in the build output",
          "Security headers including a Content Security Policy, served without middleware so routes stay static",
          "Social images generated at build time from the content layer",
        ],
      },
      {
        heading: "Engineering Challenges",
        body: [
          "Most of the difficulty was in keeping promises the site makes about itself.",
        ],
        bullets: [
          "Contrast as a test: every theme token is converted from oklch to sRGB, and the test suite fails if a pair drops below its WCAG threshold",
          "A Content Security Policy without middleware, because middleware would have made every route dynamic",
          "Motion that never delays the largest contentful paint, and collapses entirely under reduced motion",
          "A deploy gate that refuses a production build while any project is still seeded example content",
        ],
      },
      {
        heading: "Testing",
        body: [
          "336 Vitest tests over the logic that can be wrong: validation, content invariants, contrast, metadata and structured data. UI is verified in a real browser instead, with axe run on every route in both themes.",
        ],
      },
      {
        heading: "Technology",
        body: [
          "A deliberately small stack, so the site stays fast and the next developer can read it.",
        ],
        bullets: [
          "Next.js with the App Router, React 19 and the React Compiler",
          "TypeScript in strict mode",
          "Tailwind CSS v4 and shadcn/ui on Radix",
          "Motion, code split and reduced-motion aware",
          "react-hook-form, Zod and Resend for the contact form",
          "Vitest",
        ],
      },
      {
        heading: "My Role",
        body: [
          "Role: Sole developer. I adapted the design reference, and built the frontend, the content layer, the contact form and its server action, the accessibility and performance work, and the tests.",
        ],
      },
      {
        heading: "Outcome",
        body: [
          "Lighthouse accessibility, best practices and SEO all score 100 on the mobile preset, axe reports no violations on any route in either theme, and layout shift is zero.",
          "Performance measured 88 to 95 on the same preset: a case study reached the 95 target, and the home page and contact form came in below it. The cause is recorded rather than glossed: simulated Slow 4G turns the critical path into seconds of render delay, while the same page reaches its largest contentful paint in under 100 ms in a real browser. Reporting only the flattering half of that would undercut the point of the site.",
        ],
      },
    ],
  },
] as const satisfies readonly Project[];
