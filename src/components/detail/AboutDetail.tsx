import Link from "next/link";
import { ProfilePortrait } from "@/components/primitives/ProfilePortrait";
import { StatusPill } from "@/components/primitives/StatusPill";
import { getProfile, getProfileLinks } from "@/content";
import { toContactLink } from "@/lib/links";
import { BACKGROUND_LINKS } from "@/lib/site";

/* The full narrative, moved out of the home About section rather than rewritten.
   No `Reveal`: this is the reason the page exists, and Reveal server-renders
   `opacity: 0`, so wrapping it would make the content depend on JavaScript
   having run. */
export function AboutDetail() {
  const profile = getProfile();
  const links = getProfileLinks()
    .filter((link) => link.key !== "cv")
    .map(toContactLink);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
      {profile.longBio.length > 0 ? (
        <div className="max-w-2xl space-y-5 text-base leading-relaxed text-muted-foreground">
          {profile.longBio.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      {/* The same split as the home section: below `lg` the portrait leads,
          from `lg` it heads the side column. */}
      <div className="contents lg:block lg:space-y-8 lg:border-l lg:border-border lg:pl-8">
        {/* Eager, because stacked it sits just under the page header, where a
            lazy load would delay the Largest Contentful Paint. */}
        <ProfilePortrait
          portrait={profile.portrait}
          loading="eager"
          className="order-first"
        />

        <dl className="space-y-6 text-sm">
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Based
            </dt>
            <dd className="mt-2">{profile.location}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Availability
            </dt>
            <dd className="mt-2 space-y-2">
              <StatusPill status={profile.availability.status} />
              <p className="text-muted-foreground">
                {profile.availability.detail}
              </p>
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Working with clients in
            </dt>
            <dd className="mt-2">{profile.serviceArea.join(" · ")}</dd>
          </div>
          {links.length > 0 ? (
            <div>
              <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Elsewhere
              </dt>
              <dd className="mt-2">
                <ul role="list" className="space-y-1.5">
                  {links.map((link) => (
                    <li key={link.key}>
                      <a
                        href={link.href}
                        className="rounded-sm underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
          {/* The background pages left the primary navigation, so this is
              where a reader who wants the detail finds them. */}
          <div>
            <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Background
            </dt>
            <dd className="mt-2">
              <ul role="list" className="space-y-1.5">
                {BACKGROUND_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-sm underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
