import type { Profile } from "@/types/content";

/* PLACEHOLDER CONTENT. Every string here is seeded and must be replaced with
   real copy before launch. The proof points in particular assert numbers that
   have not been measured yet: feature 11 runs the Lighthouse, axe, and Core Web
   Vitals passes, and each value below must be replaced with what that pass
   actually recorded, or removed. A number whose evidence does not hold up is
   the exact failure this site was designed to avoid. */
export const profile = {
  name: "Mohamed Noor",

  headline: "Figma files in. Production Next.js out.",

  specialisms: ["figma-to-nextjs", "saas-platforms"],

  shortBio:
    "Front ends that match the design file, hold their performance budget, and pass a keyboard test before handover. And React, Node, and Postgres platforms for teams in healthcare and fintech.",

  longBio: [
    "I build web products end to end, and I care most about the part clients usually cannot see: whether the thing is fast on a mid-range phone, whether it works with a keyboard, and whether the next developer can read it.",
    "Most of my work falls into two shapes. The first is taking a finished design file and turning it into a responsive, accessible production site that matches the design and loads quickly. The second is building the front end and the API for products handling sensitive data, where access control, auditability, and a real testing story matter more than shipping fast.",
    "I work in the open: a shared board, a staging URL from day one, and a short written update at the end of each week so you always know what changed.",
  ],

  availability: {
    status: "available",
    detail: "Taking on new projects, with capacity for one build at a time.",
  },

  location: "Remote",

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

  proofPoints: [
    {
      value: "95+",
      label: "Lighthouse performance",
      evidence:
        "Measured on this site's own routes with the mobile preset, re-run before each release.",
    },
    {
      value: "WCAG 2.1 AA",
      label: "Accessibility target",
      evidence:
        "Every route passes an automated axe check plus a manual keyboard pass, in both themes.",
    },
    {
      value: "100%",
      label: "Statically generated routes",
      evidence:
        "Visible in the Next.js build output route table; the only server work is the contact form.",
    },
  ],
} as const satisfies Profile;
