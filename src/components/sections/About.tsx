import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { StatusPill } from "@/components/primitives/StatusPill";
import { getProfile } from "@/content";

export function About() {
  const profile = getProfile();

  return (
    <Section id="about" label="About" heading="How I work">
      <Reveal>
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
          </dl>
        </div>
      </Reveal>
    </Section>
  );
}
