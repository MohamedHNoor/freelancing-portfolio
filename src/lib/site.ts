export type NavItem = {
  label: string;
  href: string;
};

export const SITE = {
  /* Not rendered as a visible wordmark: the header and footer show the MHN
     mark alone, by design. This value still has three jobs, so it must never be
     blank: the browser tab and metadata title, the footer copyright line, and
     the accessible name of the logo link, which is a bare SVG and would
     otherwise announce as "link" with no destination. */
  name: "Mohamed Noor",
  description:
    "Freelance developer turning Figma designs into fast, accessible Next.js sites, and building React and Node platforms for healthcare and fintech teams.",
} as const;

/* Same-page anchors only, so nothing here can 404 before the sections exist.
   Features 3 to 5 must give their sections these exact ids. Route items
   (/projects, /resume) arrive with features 6 and 8, and the feature that adds
   the first one also owns the aria-current rule. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];
