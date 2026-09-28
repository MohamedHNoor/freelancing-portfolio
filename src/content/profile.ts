import type { Profile } from "@/types/content";

/* Real content. Every claim here is either something the developer confirmed or
   something that was measured.

   The proof points in particular: feature 12 measured them, and the evidence
   line says which measurement produced each one. A number whose evidence does
   not hold up is the exact failure this site was designed to avoid, so if one
   stops being true, change the number or delete the entry. Do not soften the
   evidence.

   Nothing here should describe a process that is not actually followed. An
   earlier draft promised a shared board, a staging URL from day one and a
   weekly written update; it was seeded copy, never confirmed, and a client who
   takes it literally on the first engagement is owed exactly that. */
export const profile = {
  name: "Mohamed Noor",

  /* All three tracks in two short sentences, because the reader is on a
     phone, arriving from a message thread, and deciding in about a second.

     "Design files to production" is both design-led tracks at once: an agency
     and a founder with a Figma file are buying the same thing, a file that
     becomes a real site. "SaaS to launch" is the startup track, and the word
     that matters is "launch": the product reaches paying customers with
     authentication, tenant isolation, payments and tests in place, rather than
     as a demo that needs rebuilding. The travel platform is the evidence for
     that half, and it has to stay true. Who each track is for is the short
     bio's job, directly below.

     Deliberately no verb and no "your". An earlier, warmer version read "The
     site your design file promised", which was better copy in isolation and
     worse at the job: at 78 characters it took three lines and the reader had
     to finish a sentence to learn what is on offer. */
  headline: "Design files to production. SaaS to launch.",

  /* Agency and startup first, matching the service order. The hero code card
     prints these slugs, so they are visible copy as well as keys. */
  specialisms: ["agency-builds", "startup-saas", "figma-to-nextjs"],

  /* Names who each track is for, which the headline deliberately does not, and
     covers all three: Figma files built white-label for agencies or directly
     for founders, and startup SaaS from schema to launch. */
  shortBio:
    "I build Figma files into fast, accessible Next.js sites, white-label for agencies or directly for founders, and take startup SaaS products from first schema to launch on React, Node and Postgres.",

  /* The last thing on every page, so it carries what the hero does not: where I
     am, and the promise that outlasts the engagement. */
  closing:
    "Based in Wellington, New Zealand, working with clients across timezones. Every project is handed over on delivery, so the codebase is yours.",

  longBio: [
    "I have been freelancing since August 2023, straight out of a year-long full-stack program. Most of that work has been handed over on delivery, so the client owns the codebase and nothing they paid for depends on me still being around.",
    "The work I take on comes in three shapes. The first is agency work, delivered white-label: the agency keeps the client and the credit, and I build the site or web app from their design, inside their process. The second is startup product work: a SaaS taken from its first schema to a launch that holds up, with authentication, tenant isolation, payments and a real testing story in place before the first paying customer depends on them. The travel platform in my projects is that kind: a shared prepaid wallet, an append-only ledger, and tenant isolation enforced by Postgres rather than by remembering to add a filter. The third is the one this site demonstrates: a finished design file turned into a responsive, accessible production site that matches it and loads quickly.",
    "I care most about the part a client usually cannot see: whether it is fast on a mid-range phone, whether it works with a keyboard, and whether the next developer can read it. This site is the argument for that. Its accessibility score, contrast and performance numbers are published with the measurement that produced them, including the one that came in under target.",
  ],

  availability: {
    status: "available",
    detail: "Taking on new work now, one build at a time.",
  },

  /* Wellington, New Zealand, UTC+13. Named rather than left as "Remote":
     timezone is a real question for a client hiring across borders, and it is
     an advantage worth stating for anyone in Australia or New Zealand. */
  location: "Wellington, New Zealand",

  /* Public content, deliberately here rather than in `.env`. These render on
     the site, so they belong in version control where a fresh clone and a
     deploy both have them; an environment variable would leave the links
     missing anywhere the variable was not set.

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

  /* Measured in feature 12. The performance claim that used to sit here read
     "95+" and had never been run; the mobile preset actually returns 92 to 97
     across the three routes measured, so it was removed rather than restated.
     Accessibility replaced it because it is the number this site genuinely
     earned. Feature 13 re-measures against the deployment and decides whether a
     performance figure goes back. */
  proofPoints: [
    {
      value: "100/100",
      label: "Lighthouse accessibility",
      evidence:
        "Scored on the home page, a case study and the contact form with the mobile preset, against a production build.",
    },
    {
      value: "WCAG 2.1 AA",
      label: "Accessibility target",
      evidence:
        "Zero axe violations on every route in both themes, including the open menu and a form showing its errors. Colour contrast is a test that fails the build.",
    },
    {
      value: "100%",
      label: "Statically generated routes",
      evidence:
        "Visible in the Next.js build output route table; the only server work is the contact form.",
    },
  ],
} as const satisfies Profile;
