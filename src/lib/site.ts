export type NavItem = {
  label: string;
  href: string;
};

/* Site-level only. Person-level facts (name, bio, links, availability) live in
   the content layer; read them with `getProfile()` from `@/content`.
   Feature 10 owns metadata properly and may replace this. */
export const SITE = {
  description:
    "Freelance developer turning Figma designs into fast, accessible Next.js sites, and building React and Node platforms for healthcare and fintech teams.",
} as const;

/* Every item is a route. Contact was the last anchor and the last dead link;
   feature 10 gave it a page.

   Each of these has a home section too, reachable by scrolling. The nav points
   at the pages because that is what a proposal links to directly, and because
   the page carries the full content while the section carries a summary.

   Route items are what `NavLink` can mark `aria-current="page"`; it treats
   anything containing `#` as an anchor and never marks it. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "Skills", href: "/skills" },
  { label: "Experience", href: "/experience" },
  { label: "Resume", href: "/resume" },
  { label: "Contact", href: "/contact" },
];
