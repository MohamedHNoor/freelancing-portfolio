import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { SectionLink } from "@/components/primitives/SectionLink";
import { Card, CardContent } from "@/components/ui/card";
import { getServices } from "@/content";

/* A summary of all three tracks. What each one delivers and how a project actually
   runs lives at `/services`; repeating them here would put the same content on
   two URLs and cost the home page the scroll it has to earn.

   Order comes from `getServices()`, which sorts by `order` and puts the agency
   track first. Do not sort again here. */
export function Services() {
  const services = getServices();

  if (services.length === 0) {
    return null;
  }

  return (
    <Section
      id="services"
      label="Services"
      heading="Three ways to work with me"
      lead="All three run the same way: small reviewable pieces, a staging URL you can open at any point, and a handover that leaves you able to change things without me."
    >
      <ul role="list" className="grid gap-6 lg:grid-cols-3">
        {services.map((service) => (
          <li key={service.slug} className="min-w-0">
            {/* One Reveal per panel, so each track enters on its own scroll
                position rather than all waiting on the tallest one. `h-full`
                lets the card's own `h-full` reach the grid row, so the three
                panels end level. */}
            <Reveal className="h-full">
              <Card className="h-full [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
                <CardContent className="min-w-0">
                  <h3 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {service.forWho}
                  </p>
                  <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                    {service.summary}
                  </p>
                  <dl className="mt-6">
                    <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Typical timeline
                    </dt>
                    <dd className="mt-2 text-sm">{service.typicalTimeline}</dd>
                  </dl>
                </CardContent>
              </Card>
            </Reveal>
          </li>
        ))}
      </ul>

      <SectionLink href="/services">See what each track includes</SectionLink>
    </Section>
  );
}
