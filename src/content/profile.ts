import type { Profile } from "@/types/content";

/* PLACEHOLDER CONTENT. Every string here is seeded and must be replaced with
   real copy before launch.

   The proof points are the exception: feature 12 measured them and they are
   real. Every value below is something that pass actually recorded, and the
   evidence line says which measurement produced it. A number whose evidence
   does not hold up is the exact failure this site was designed to avoid, so if
   one of these stops being true, change the number or delete the entry. Do not
   soften the evidence. */
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
