import Link from "next/link";
import { Logo } from "@/components/icons/Logo";
import { getProfile, getProfileLinks } from "@/content";
import { toContactLink } from "@/lib/links";
import { NAV_ITEMS } from "@/lib/site";

export function Footer() {
  const profile = getProfile();
  const year = new Date().getFullYear();

  /* `cv` drives the resume download rather than being somewhere to reach a
     person, so it is filtered out here the way `/resume` does. Everything else
     supplied renders; `getProfileLinks()` has already dropped the empties, so
     an unset link is absent rather than dead. */
  const contactLinks = getProfileLinks()
    .filter((link) => link.key !== "cv")
    .map(toContactLink);

  return (
    <footer data-print-hidden="" className="border-t border-border">
      {/* Three proportional columns. Two earlier versions of this left a wide
          void in the middle: the first pushed the navigation to the far edge,
          and the second gave the brand column `minmax(0,1fr)` so it stretched
          to 639px while its content stayed capped at `max-w-sm`, which just
          moved the gap inside the column. Fractional widths let the content set
          the proportions, and the navigation runs two across rather than as a
          seven-item strip that dominated the block. 406px to 310px.

          It also carries a way to reach someone, which no version before this
          did. This is the last thing on every page, so a reader who has
          scrolled the whole of /skills should not have to navigate back to find
          an address. */}
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1.1fr_1.3fr] md:gap-12 lg:px-8">
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <Logo className="size-10" id="logo-footer" />
            <span className="sr-only">{profile.name}</span>
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {profile.closing}
          </p>
        </div>

        <nav aria-labelledby="footer-nav-label">
          <p
            id="footer-nav-label"
            className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
          >
            Pages
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="-mx-2 inline-block rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {contactLinks.length > 0 ? (
          <div>
            <p
              id="footer-contact-label"
              className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
            >
              Elsewhere
            </p>
            {/* The address is the label, not the word "Email". On a page a
                reader may print or screenshot, a link that says "GitHub" gives
                them nothing to type; `toContactLink` returns the address with
                the scheme stripped for exactly this reason. */}
            <ul
              aria-labelledby="footer-contact-label"
              className="mt-4 space-y-1"
            >
              {contactLinks.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="-mx-2 inline-block rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border">
        <p className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
          &copy; {year} {profile.name}. Built with Next.js and Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}
