import { ProfilePortrait } from "@/components/primitives/ProfilePortrait";
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
  /* Two paragraphs, which with the details row under them come out about as
     tall as the portrait beside them. */
  const opening = profile.longBio.slice(0, 2);

  return (
    <Section id="about" label="About" heading="About Mohamed">
      <Reveal>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
          {/* The details sit under the bio rather than under the portrait, as
              they do on `/about`: stacked beside a two-paragraph summary, the
              side column ran about 250px past the text. */}
          <div className="max-w-2xl">
            {opening.length > 0 ? (
              <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                {opening.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            ) : null}

            <dl className="mt-8 grid gap-6 border-t border-border pt-8 text-sm sm:grid-cols-2">
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

          {/* Leads the stacked layout, so it does not arrive after the bio. */}
          <ProfilePortrait
            portrait={profile.portrait}
            className="order-first lg:order-0"
          />
        </div>

        <SectionLink href="/about">Read more about me</SectionLink>
      </Reveal>
    </Section>
  );
}
