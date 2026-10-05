import type { SkillGroup } from "@/types/content";

/* Every `context` line names where the technology was actually used: the travel
   platform and this site are both in `projects.ts`, and the rest point at
   delivered client work or public repositories. Context is the whole point of
   this section. A line that describes the kind of thing a technology is for,
   rather than where it was used, is worth less than omitting the entry, and is
   the skill-percentage-bar problem wearing a different hat.

   The public-repository claims were read from the dependency manifests and
   test files of github.com/MohamedHNoor, forks excluded. A dependency is not
   evidence on its own: Create React App and the Expo template install Jest and
   Testing Library by default, so a testing claim here counts repositories with
   test files in them, which is why the Expo apps are not claimed as tested.

   Only the technologies a buyer scans for carry an `icon`, because every mark
   is drawn in the hero row twice and again in the home skills section. The
   supporting ones, such as Sass, Bootstrap and Webpack, are listed by name.

   Groups are organised by purpose, as a buyer reads a stack: what the product
   is built with, where its data lives, how people sign in, how it takes
   money, and where it runs. `featured` marks the technologies the home page's
   summary names, and `resume` the ones `/resume` lists; `/skills` lists every
   entry with its context.

   Group order is the canonical order. The hero row reads the technology groups
   and skips Practices, which are not products with a logo. */
export const skillGroups = [
  {
    id: "frontend",
    label: "Frontend",
    skills: [
      {
        name: "Next.js",
        context:
          "This site: App Router, server components, static generation for every route, and a Server Action for the one form. The travel platform's web app on Next.js 16. Also mostore, an e-commerce store on Prisma and Neon, and a job board with NextAuth and file uploads.",
        icon: "nextjs",
        featured: true,
        resume: true,
      },
      {
        name: "React",
        context:
          "The travel platform's web app and every client build since 2023, from dashboards to landing pages, plus 38 public repositories.",
        icon: "react",
        featured: true,
        resume: true,
      },
      {
        name: "TypeScript",
        context:
          "Strict mode on both projects here. On the travel platform it runs the full depth, from Drizzle schema to API response to the web app.",
        icon: "typescript",
        featured: true,
        resume: true,
      },
      {
        name: "JavaScript",
        context:
          "The language underneath, and still what most of my public repositories are written in.",
        icon: "javascript",
        featured: true,
        resume: true,
      },
      {
        name: "Tailwind CSS",
        context:
          "v4 on both projects here, CSS-first, with the design tokens defined once and the contrast between them enforced by a test.",
        icon: "tailwind",
        featured: true,
        resume: true,
      },
      {
        name: "shadcn/ui",
        context:
          "Radix primitives retuned to the brand palette on both projects, rather than shipped as stock components.",
        icon: "shadcn",
        featured: true,
        resume: true,
      },
      {
        name: "Redux",
        context:
          "Redux Toolkit on eight public React builds, and the cart on the e-commerce ones, including Comfy Store, where it has to stay consistent across routes and reloads.",
        icon: "redux",
      },
      {
        name: "TanStack Query",
        context:
          "Server state on the travel platform's web app, with a fresh client per server request, and on Comfy Store, an Unsplash image search and a React Native laundry app.",
        icon: "tanstack",
      },
      {
        name: "React Hook Form",
        context:
          "This site's enquiry form and the travel platform's forms, each paired with a Zod schema, and the forms on a Next.js job board and a shop management build.",
        icon: "react-hook-form",
      },
      {
        name: "Motion",
        context:
          "This site's staged entrances, code-split through LazyMotion and collapsed under reduced motion, and three earlier Next.js and React builds.",
      },
      {
        name: "Sass",
        context:
          "Six public builds, from the asset pipeline on four Rails apps to two React clothing stores.",
      },
      {
        name: "styled-components",
        context:
          "Component styling on five public builds, including a car rental front end, a GitHub user search and MealTime, an Expo app.",
      },
      {
        name: "Bootstrap",
        context:
          "Six public builds, including a car rental front end, a MERN authentication app and several Rails apps.",
      },
      {
        name: "Accessibility",
        context:
          "This site scores 100 on Lighthouse accessibility with zero axe violations in both themes, and contrast is a test that fails the suite.",
      },
    ],
  },
  {
    id: "backend",
    label: "Backend",
    skills: [
      {
        name: "Node.js",
        context:
          "The travel platform's API, and the backend of the inventory and dashboard work delivered to clients.",
        icon: "nodejs",
        featured: true,
        resume: true,
      },
      {
        name: "Express.js",
        context:
          "Express 5 on the travel platform: route modules with middleware wiring, validation and thin controllers.",
        icon: "express",
        featured: true,
        resume: true,
      },
      {
        name: "Ruby on Rails",
        context:
          "Seventeen public Rails apps, most on PostgreSQL, including budget and recipe apps deployed to Heroku, an e-commerce build, and an API-only app authenticated with JWT.",
        icon: "rails",
        featured: true,
        resume: true,
      },
      {
        name: "REST APIs",
        context:
          "The travel platform's versioned API, covering search, bookings, payments, wallet, organisations and an admin surface. In public repositories, store and task-manager APIs on Express and MongoDB, and an API-only Rails app.",
        featured: true,
        resume: true,
      },
      {
        name: "Ruby",
        context:
          "The language under those Rails apps, and the primary language of 20 public repositories.",
      },
      {
        name: "Hotwire",
        context:
          "Turbo and Stimulus across thirteen Rails apps, including a single-page quote editor with one line of custom JavaScript.",
      },
      {
        name: "Server Actions",
        context:
          "This site's contact form: the only server work on an otherwise fully static site.",
        resume: true,
      },
      {
        name: "Zod",
        context:
          "One schema shared by browser and server on this site, and validation at every request boundary on the travel platform.",
        icon: "zod",
      },
    ],
  },
  {
    id: "database",
    label: "Database",
    skills: [
      {
        name: "PostgreSQL",
        context:
          "The travel platform's whole domain, including row-level security proved from a non-superuser connection, and the database under thirteen public Rails apps.",
        icon: "postgresql",
        featured: true,
        resume: true,
      },
      {
        name: "PostgreSQL Row-Level Security",
        context:
          "The travel platform's tenant isolation, proved by a test that connects as a dedicated non-superuser role and still cannot read another tenant's rows. The API refuses to boot in production if its role would bypass the policies.",
        resume: true,
      },
      {
        name: "Neon",
        context:
          "Serverless Postgres behind mostore, a Next.js e-commerce build, connected through Prisma's Neon adapter.",
        icon: "neon",
        featured: true,
        resume: true,
      },
      {
        name: "Supabase",
        context:
          "An e-commerce store built on Next.js, with Supabase behind it and Clerk for auth.",
        icon: "supabase",
        featured: true,
        resume: true,
      },
      {
        name: "MongoDB",
        context:
          "The MERN builds in my public repositories, through Mongoose, including a notes board and two REST APIs.",
        icon: "mongodb",
        featured: true,
        resume: true,
      },
      {
        name: "Firebase",
        context:
          "Authentication and messaging on ChitChat, an Expo messaging app, and the backend of four other public builds, including two React clothing stores.",
        icon: "firebase",
      },
      {
        name: "Redis",
        context:
          "Rate limiting through Upstash on a MERN notes board, and on a real-time search app built in Rails.",
        icon: "redis",
        resume: true,
      },
    ],
  },
  {
    id: "orm",
    label: "Data & ORM",
    skills: [
      {
        name: "Drizzle",
        context:
          "The travel platform, including the conditional updates that make an inventory decrement and a wallet debit atomic, and its drizzle-kit migrations.",
        icon: "drizzle",
        featured: true,
        resume: true,
      },
      {
        name: "Prisma",
        context:
          "The ORM on four Next.js builds, including mostore, an e-commerce store, and a job board.",
        icon: "prisma",
        featured: true,
        resume: true,
      },
      {
        name: "Audit logging",
        context:
          "The travel platform's append-only ledger, with database constraints as the backstop rather than the plan.",
      },
    ],
  },
  {
    id: "auth",
    label: "Authentication",
    skills: [
      {
        name: "Better Auth",
        context:
          "The travel platform: a revocable session in an httpOnly, SameSite=Lax cookie, optional Google sign-in, email verification and password reset, with no credential in localStorage.",
        featured: true,
        resume: true,
      },
      {
        name: "Clerk",
        context:
          "Sign-in on an e-commerce store built on Next.js and Supabase, and on other Next.js builds in my public repositories.",
        featured: true,
        resume: true,
      },
      {
        name: "Session-based authentication",
        context:
          "The travel platform's Better Auth sessions, Devise across seven public Rails apps, and JWT in an httpOnly cookie on a MERN build.",
        featured: true,
        resume: true,
      },
      {
        name: "Role-based access control",
        context:
          "The travel platform: organisation owners and members who see different bookings and commissions, and two admin roles where only one may change platform data.",
        featured: true,
        resume: true,
      },
    ],
  },
  {
    id: "payments",
    label: "Payments & Integrations",
    skills: [
      {
        name: "Stripe",
        context:
          "Payment gateway work on platform builds, alongside Paystack on the travel platform, where webhooks are verified by HMAC before anything is trusted.",
        icon: "stripe",
        featured: true,
        resume: true,
      },
      {
        name: "Paystack",
        context:
          "The travel platform's checkout, with payment initialisation, verification and a webhook proved unable to double-credit when replayed.",
        featured: true,
        resume: true,
      },
      {
        name: "Webhooks",
        context:
          "Paystack webhooks on the travel platform, verified by HMAC-SHA512 before anything is trusted, with a replay queue in the admin console.",
        featured: true,
        resume: true,
      },
    ],
  },
  {
    id: "infrastructure",
    label: "Deployment & Infrastructure",
    skills: [
      {
        name: "Vercel",
        context:
          "This site's deployment target, configured with its environment contract and a build that refuses to ship seeded example content.",
        icon: "vercel",
        featured: true,
        resume: true,
      },
      {
        name: "Railway",
        context:
          "Where the travel platform runs, as two stateless services built from their own Docker images.",
        featured: true,
        resume: true,
      },
      {
        name: "Docker",
        context:
          "The travel platform ships as two images, an API and a web app, so the same builds run on Railway, Fly, Cloud Run or a plain VPS.",
        icon: "docker",
        featured: true,
        resume: true,
      },
      {
        name: "GitHub Actions",
        context:
          "The travel platform's CI: lint, typecheck, test and build for both packages, with the API's suites against a real Postgres service. A lint workflow also runs on 36 of my public repositories.",
        icon: "github-actions",
        featured: true,
        resume: true,
      },
    ],
  },
  {
    id: "mobile",
    label: "Mobile",
    skills: [
      {
        name: "React Native",
        context:
          "Seven Expo apps in my public repositories, from a task app to ChitChat, a messaging app with Firebase authentication and messaging.",
        icon: "react",
        resume: true,
      },
      {
        name: "Expo",
        context:
          "Expo Router for navigation on five of those apps, with NativeWind carrying Tailwind's styling over to native on four.",
        icon: "expo",
        resume: true,
      },
    ],
  },
  {
    id: "tooling",
    label: "Testing & Tooling",
    skills: [
      {
        name: "Vitest",
        context:
          "336 tests on this site, and the travel platform's 357 server and 739 frontend tests.",
        icon: "vitest",
        resume: true,
      },
      {
        name: "Playwright",
        context:
          "Browser verification on this site: the keyboard walk, the axe sweep in both themes, and the reduced-motion pass.",
        resume: true,
      },
      {
        name: "Jest",
        context:
          "Test suites on six public builds, with React Testing Library on the four React ones: a car rental front end, a calculator, a space travel app and a metrics app.",
        resume: true,
      },
      {
        name: "RSpec",
        context:
          "Four Rails apps, including 20 spec files on the blog app with rswag documenting its API. Most of the other Rails apps are tested with Minitest, with Capybara for system tests.",
        resume: true,
      },
      {
        name: "Figma",
        context:
          "The starting point for agency and design-to-code builds: reading the file first and listing every screen, state and breakpoint it implies but does not draw.",
        icon: "figma",
      },
      {
        name: "Git",
        context: "Every project here and more than 130 public repositories.",
        icon: "git",
      },
      {
        name: "Vite",
        context:
          "Ten public React builds, including Comfy Store and a MERN notes board.",
        icon: "vite",
      },
      {
        name: "Webpack",
        context:
          "A hand-written config on eight public builds, including a leaderboard and a TV show browser.",
      },
    ],
  },
  {
    id: "practices",
    label: "Practices",
    skills: [
      {
        name: "Performance budgets",
        context:
          "This site records its transferred weight per route with a ceiling on each, measured in the browser because the build reports no sizes.",
      },
      {
        name: "Design fidelity",
        context:
          "Matching the file at every breakpoint, and saying so when a part of it should change: the reference for this site carried invented statistics, and they were removed rather than built.",
      },
      {
        name: "Written handover",
        context:
          "The codebase is handed over on delivery. Every client engagement I have taken has ended that way.",
      },
    ],
  },
] as const satisfies readonly SkillGroup[];
