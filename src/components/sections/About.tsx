import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { SectionLink } from "@/components/primitives/SectionLink";
import { StatusPill } from "@/components/primitives/StatusPill";
import { getProfile } from "@/content";

/* A summary, not the whole narrative. The rest lives at `/about`. Showing the
   full bio here and again on the page would be the same content twice, which
   costs the home page scroll it has to earn and hands feature 11 a canonical
   URL problem. */
export function About() {
  const profile = getProfile();
  /* Two paragraphs, not one: the opening alone is two lines, which left the
     column beside the location and availability mostly empty. */
  const opening = profile.longBio.slice(0, 2);

  return (
    <Section id="about" label="About" heading="About Mohamed">
      <Reveal>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
          {opening.length > 0 ? (
            <div className="max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground">
              {opening.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          <dl className="space-y-6 text-sm lg:border-l lg:border-border lg:pl-8">
            <div>
              <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Location
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
          </dl>
        </div>

        <SectionLink href="/about">Read more about me</SectionLink>
      </Reveal>
    </Section>
  );
}
