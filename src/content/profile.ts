import type { Profile } from "@/types/content";

/* Real content. Every claim here is something the developer confirmed.

   The positioning is a full-stack web development business for businesses,
   startups and agencies, so the copy names business problems first and
   technologies second. Nothing here should describe a process that is not
   actually followed: a client who takes it literally on the first engagement
   is owed exactly what it says.

   Measured numbers live on the case studies in `projects.ts`, next to the
   measurement that produced each one, rather than here. */
export const profile = {
  name: "Mohamed Noor",

  role: "Full-Stack Web Developer",

  /* One sentence, so `headlineLines` renders it as one block that wraps
     naturally rather than forcing a break. */
  headline: "Websites and Web Applications Built for Your Business",

  /* Must appear in `headline` exactly as written, or the build fails. */
  headlineEmphasis: "Your Business",

  shortBio:
    "I build fast, modern websites and custom web applications for businesses, startups and agencies.",

  primaryStack: ["Next.js", "React", "TypeScript", "Node.js", "PostgreSQL"],

  longBio: [
    "I'm a full-stack web developer based in Wellington, New Zealand. I build modern websites and custom web applications for businesses, startups and agencies.",
    "My work covers the complete development lifecycle: understanding the requirements, designing the technical architecture, then building the frontend, backend, database and integrations, testing it, and deploying it.",
    "I particularly enjoy building products where software needs to solve a real business problem rather than simply display information. The travel platform in my work is that kind: a shared prepaid wallet, bookings that stay correct when two people buy the last seat at once, and tenant isolation enforced by Postgres rather than by remembering to add a filter.",
    "My primary development stack is Next.js, React, TypeScript, Node.js and PostgreSQL. I also have experience with Ruby on Rails, MongoDB, Supabase, Drizzle, Prisma, authentication systems, payment integrations and REST APIs.",
    "I have been freelancing since August 2023, straight out of a year-long full-stack program. I work directly with clients and prefer a clear, milestone-based process where progress can be reviewed throughout, and every project ends with a handover, so the codebase is yours and nothing you paid for depends on me still being around.",
  ],

  availability: {
    status: "available",
    detail: "Taking on selected freelance projects",
  },

  /* Named rather than left as "Remote": timezone is a real question for a
     client hiring across borders, and it is an advantage worth stating for
     anyone in Australia or New Zealand. */
  location: "Wellington, New Zealand",

  /* Regions the owner works with clients in today. Named clients belong in
     case studies, not here. */
  serviceArea: ["New Zealand", "Australia", "International"],

  /* A WebP resized from the original 1254px PNG, which was 2.1 MB. The box
     is at most 240px wide, so 800px still covers a 3x screen. */
  portrait: {
    src: "/assets/mohamed-noor.webp",
    alt: "Mohamed Noor in a dark wool coat and white shirt, with a harbour city and hills behind.",
    width: 800,
    height: 800,
  },

  /* The full composition, which also paints a copy of the hero's own text on
     its left and a service strip along its bottom. `HeroShowcase` crops both
     away, so the dimensions here are the whole file's. Generated at this size;
     the original PNG is the source and this WebP is derived from it. */
  heroShowcase: {
    src: "/assets/hero-showcase.webp",
    alt: "Selected web and mobile development projects by Mohamed Noor",
    width: 1690,
    height: 931,
  },

  /* Public content, deliberately here rather than in `.env`. These render on
     the site, so they belong in version control where a fresh clone and a
     deploy both have them.

     Empty means not supplied. Read these through `getProfileLinks()` so an
     unsupplied link renders as nothing rather than as a dead link. The scheme
     is optional: `toContactLink` adds `mailto:` or `https://` when absent. */
  links: {
    email: "info@mohamedhnoor.com",
    github: "https://github.com/MohamedHNoor",
    linkedin: "https://www.linkedin.com/in/mohamedhnoor",
    /* Set to a path such as `/mohamed-noor-cv.pdf` once a file exists in
       `public/`. The download button on `/resume` appears when it does. */
    cv: "",
  },
} as const satisfies Profile;
