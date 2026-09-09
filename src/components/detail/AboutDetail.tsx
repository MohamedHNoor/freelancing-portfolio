import { StatusPill } from "@/components/primitives/StatusPill";
import { getProfile, getProfileLinks } from "@/content";
import { toContactLink } from "@/lib/links";

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

      <dl className="space-y-6 text-sm lg:border-l lg:border-border lg:pl-8">
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
          <dd className="mt-2">
            <StatusPill status={profile.availability.status} />
          </dd>
        </div>
        {/* Renders nothing today: every `profile.links` value is the empty
            string, and `getProfileLinks()` drops what is not supplied. */}
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
      </dl>
    </div>
  );
}
