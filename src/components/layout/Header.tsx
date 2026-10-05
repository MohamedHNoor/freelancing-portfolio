import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavLink } from "@/components/layout/NavLink";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/content";
import { NAV_ITEMS, PRIMARY_CTA } from "@/lib/site";

export function Header() {
  const profile = getProfile();

  return (
    <header data-print-hidden="" className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* The mark is decorative, so the name carries the link's accessible
            name. Without it this link would announce as "link, image". */}
        <Link
          href="/"
          className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <Logo className="size-10" id="logo-header" />
          <span className="sr-only">{profile.name}</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-0.5">
          <Button asChild size="sm" className="mr-1 h-9 px-3.5">
            <Link href={PRIMARY_CTA.href}>{PRIMARY_CTA.label}</Link>
          </Button>
          <ThemeToggle />
          <MobileNav name={profile.name} />
        </div>
      </div>
    </header>
  );
}
