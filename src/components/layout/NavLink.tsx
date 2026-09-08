"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
};

/* A client leaf rather than a client Header: reading `usePathname` in the
   header itself would make it a client component, and it calls `getProfile()`,
   so the whole content layer including every case study would follow it into
   the browser bundle. `MobileNav` avoids the same trap by taking `name` as a
   prop.
 *
 * Only a route item can be current. A same-page anchor such as `/#about` is a
 * position on a page rather than a page, and marking it `aria-current="page"`
 * would tell a screen reader user they had arrived somewhere they have not. */
export function NavLink({ href, className, onClick, children }: NavLinkProps) {
  const pathname = usePathname();
  const isRouteItem = !href.includes("#");
  const isCurrent = isRouteItem && pathname === href;

  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      onClick={onClick}
      /* The visual cue lives here rather than at each call site so it cannot be
         forgotten by one of them: `aria-current` alone is invisible, and a
         sighted user needs to see which page they are on too. */
      className={cn(
        "aria-[current=page]:font-medium aria-[current=page]:text-foreground",
        className,
      )}
    >
      {children}
    </Link>
  );
}
