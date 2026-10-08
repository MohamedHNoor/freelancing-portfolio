export const WORKSPACE_NAV = [
  { label: "Overview", href: "/dashboard" },
  { label: "Clients", href: "/dashboard/clients" },
] as const;

const OVERVIEW = WORKSPACE_NAV[0];

/** Overview is current only on its own page; other sections own their nested routes. */
export function isNavItemCurrent(pathname: string, href: string): boolean {
  if (href === OVERVIEW.href) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The breadcrumb label for the section a path belongs to. */
export function workspaceSectionLabel(pathname: string): string {
  return WORKSPACE_NAV.find(({ href }) => isNavItemCurrent(pathname, href))?.label ?? OVERVIEW.label;
}
