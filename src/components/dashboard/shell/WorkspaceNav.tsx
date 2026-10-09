"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanbanIcon, LayoutDashboardIcon, UsersIcon } from "lucide-react";
import { isNavItemCurrent, WORKSPACE_NAV } from "@/lib/dashboard/navigation";
import { cn } from "@/lib/utils";

const ICONS = {
  "/dashboard": LayoutDashboardIcon,
  "/dashboard/clients": UsersIcon,
  "/dashboard/projects": FolderKanbanIcon,
} as const;

/* A client leaf so the sidebar itself stays a server component, as NavLink does
   for the public header. `aria-current` and the visible cue come from one test.
   The text size sits on the list: `cn` would drop `text-workspace-sm` as a
   conflict with the colour classes. */
export function WorkspaceNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1.5 text-workspace-sm">
      {WORKSPACE_NAV.map(({ label, href }) => {
        const Icon = ICONS[href];
        const current = isNavItemCurrent(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={current ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                current
                  ? "bg-primary/10 font-medium text-brand ring-1 ring-inset ring-primary/15"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
