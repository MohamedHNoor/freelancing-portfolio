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

/* Section anchors are absolute, not bare `#about`. With a second route in the
   site a bare hash on `/projects` would navigate to `/projects#about`, which is
   nothing at all. `/#contact` stays a dead anchor until feature 9 adds the
   section, exactly as it was before.

   `Projects` is the one route item, and feature 8 adds `/resume` the same way.
   Someone who clicks a nav item labelled Projects has asked to see the work,
   and `/projects` carries all of it with filters, where the home section shows
   only the featured subset. Route items are what `NavLink` can mark
   `aria-current="page"`; anchors are not pages. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Projects", href: "/projects" },
  { label: "Skills", href: "/#skills" },
  { label: "Experience", href: "/#experience" },
  { label: "Contact", href: "/#contact" },
];
