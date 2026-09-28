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

   Group order is the canonical order. The hero row reads the technology groups
   and skips Practices, which are not products with a logo. */
export const skillGroups = [
  {
    id: "front-end",
    label: "Front end",
    skills: [
      {
        name: "React",
        context:
          "The travel platform's SPA and every client build since 2023, from dashboards to landing pages, plus 38 public repositories.",
        icon: "react",
      },
      {
        name: "Next.js",
        context:
          "This site: App Router, server components, static generation for every route, and a Server Action for the one form. Also mostore, an e-commerce store on Prisma and Neon, and a job board with NextAuth and file uploads.",
        icon: "nextjs",
      },
      {
        name: "TypeScript",
        context:
          "Strict mode on both projects here. On the travel platform it runs the full depth, from Drizzle schema to API response.",
        icon: "typescript",
      },
      {
        name: "JavaScript",
        context:
          "The language underneath, and still what most of my public repositories are written in.",
        icon: "javascript",
      },
      {
        name: "Tailwind CSS",
        context:
          "v4 on both projects here, CSS-first, with the design tokens defined once and the contrast between them enforced by a test.",
        icon: "tailwind",
      },
      {
        name: "shadcn/ui",
        context:
          "Radix primitives retuned to the brand palette on both projects, rather than shipped as stock components.",
        icon: "shadcn",
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
          "Server-state caching on Comfy Store alongside Redux Toolkit, on an Unsplash image search, and on a React Native laundry app.",
        icon: "tanstack",
      },
      {
        name: "React Hook Form",
        context:
          "This site's enquiry form, paired with a Zod schema the browser and the server both run, and the forms on a Next.js job board and a shop management build.",
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
          "This site scores 100 on Lighthouse accessibility with zero axe violations in both themes, and contrast is a test that fails the build.",
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
      },
      {
        name: "Expo",
        context:
          "Expo Router for navigation on five of those apps, with NativeWind carrying Tailwind's styling over to native on four.",
        icon: "expo",
      },
    ],
  },
  {
    id: "back-end",
    label: "Back end",
    skills: [
      {
        name: "Node.js",
        context:
          "The travel platform's API, and the backend of the inventory and dashboard work delivered to clients.",
        icon: "nodejs",
      },
      {
        name: "Express.js",
        context:
          "Express 5 on the travel platform: 15 route modules with middleware wiring, validation and thin controllers.",
        icon: "express",
      },
      {
        name: "Ruby on Rails",
        context:
          "Seventeen public Rails apps, most on PostgreSQL, including budget and recipe apps deployed to Heroku, an e-commerce build, and an API-only app authenticated with JWT.",
        icon: "rails",
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
        name: "REST APIs",
        context:
          "The travel platform's versioned API, covering search, bookings, payments, wallet, organisations and an admin surface. In public repositories, store and task-manager APIs on Express and MongoDB, and an API-only Rails app.",
      },
      {
        name: "Server Actions",
        context:
          "This site's contact form: the only server work on an otherwise fully static site.",
      },
      {
        name: "Zod",
        context:
          "One schema shared by browser and server on this site, and validation at every request boundary on the travel platform.",
        icon: "zod",
      },
      {
        name: "Stripe",
        context:
          "Payment gateway work on platform builds, alongside Paystack on the travel platform, where webhooks are verified by HMAC before anything is trusted.",
        icon: "stripe",
      },
      {
        name: "Authentication",
        context:
          "The travel platform: a short-lived bearer token held in memory and a rotating refresh token in an httpOnly cookie, with no credential in localStorage. In public repositories, Devise across seven Rails apps, JWT in an httpOnly cookie on a MERN build, and Clerk and NextAuth on Next.js.",
      },
    ],
  },
  {
    id: "data",
    label: "Data",
    skills: [
      {
        name: "PostgreSQL",
        context:
          "The travel platform's whole domain, including row-level security proved from a non-superuser connection, and the database under thirteen public Rails apps.",
        icon: "postgresql",
      },
      {
        name: "MongoDB",
        context:
          "The MERN builds in my public repositories, through Mongoose, including a notes board and two REST APIs.",
        icon: "mongodb",
      },
      {
        name: "Supabase",
        context:
          "An e-commerce store built on Next.js, with Supabase behind it and Clerk for auth.",
        icon: "supabase",
      },
      {
        name: "Neon",
        context:
          "Serverless Postgres behind mostore, a Next.js e-commerce build, connected through Prisma's Neon adapter.",
        icon: "neon",
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
      },
      {
        name: "Prisma",
        context:
          "The ORM on four Next.js builds, including mostore, an e-commerce store, and a job board.",
        icon: "prisma",
      },
      {
        name: "Drizzle",
        context:
          "The travel platform, including the conditional updates that make an inventory decrement and a wallet debit atomic.",
        icon: "drizzle",
      },
      {
        name: "Audit logging",
        context:
          "The travel platform's append-only ledger, with database constraints as the backstop rather than the plan.",
      },
    ],
  },
  {
    id: "tooling",
    label: "Tooling",
    skills: [
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
        name: "Docker",
        context:
          "The travel platform ships as one image, so the same build runs on Railway, Fly, Cloud Run or a plain VPS.",
        icon: "docker",
      },
      {
        name: "GitHub Actions",
        context:
          "The travel platform's CI: lint, typecheck, test and build against a real Postgres container, all four required to pass. A lint workflow also runs on 36 of my public repositories.",
        icon: "github-actions",
      },
      {
        name: "Vite",
        context:
          "The travel platform's client build, and ten public React builds, including Comfy Store and a MERN notes board.",
        icon: "vite",
      },
      {
        name: "Webpack",
        context:
          "A hand-written config on eight public builds, including a leaderboard and a TV show browser.",
      },
      {
        name: "Vitest",
        context:
          "297 tests on this site, covering validation, contrast, metadata and the deploy gate.",
        icon: "vitest",
      },
      {
        name: "Jest",
        context:
          "Test suites on six public builds, with React Testing Library on the four React ones: a car rental front end, a calculator, a space travel app and a metrics app.",
      },
      {
        name: "RSpec",
        context:
          "Four Rails apps, including 20 spec files on the blog app with rswag documenting its API. Most of the other Rails apps are tested with Minitest, with Capybara for system tests.",
      },
      {
        name: "Playwright",
        context:
          "Browser verification on this site: the keyboard walk, the axe sweep in both themes, and the reduced-motion pass.",
      },
      {
        name: "Vercel",
        context:
          "This site's deployment target, configured with its environment contract and a build that refuses to ship seeded example content.",
        icon: "vercel",
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
