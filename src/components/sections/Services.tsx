import { CheckIcon } from "lucide-react";

import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { getServices } from "@/content";

/* Both tracks come from the content layer, already sorted by `order`, which puts
   the Figma track first. Do not sort again here: the ordering rule lives in
   `getServices()` so one place decides which track a visitor reads first. */
export function Services() {
  const services = getServices();

  if (services.length === 0) {
    return null;
  }

  return (
    <Section
      id="services"
      label="Services"
      heading="Two ways to work with me"
      lead="Both tracks run the same way: small reviewable pieces, a staging URL you can open at any point, and a handover that leaves you able to change things without me."
    >
      <ul role="list" className="space-y-8">
        {services.map((service) => (
          <li key={service.slug}>
            {/* One Reveal per panel, so each track enters on its own scroll
                position rather than both waiting on the taller list. */}
            <Reveal>
              <Card className="[--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-0">
                  {/* The heading is a real `h3` rather than `CardTitle`, which
                    renders a div and takes no `asChild`. The page outline is
                    h1 hero, h2 section, h3 track. */}
                  <CardHeader className="min-w-0 content-start gap-2 lg:pr-10">
                    <h3 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                      {service.name}
                    </h3>
                    <CardDescription className="leading-relaxed">
                      {service.forWho}
                    </CardDescription>
                    <dl className="mt-6">
                      <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Typical timeline
                      </dt>
                      <dd className="mt-2 text-sm">
                        {service.typicalTimeline}
                      </dd>
                    </dl>
                  </CardHeader>

                  <CardContent className="min-w-0 lg:border-l lg:border-border lg:pl-10">
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {service.summary}
                    </p>

                    {service.deliverables.length > 0 ? (
                      <>
                        <p
                          id={`${service.slug}-deliverables`}
                          className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground"
                        >
                          What you get
                        </p>
                        <ul
                          role="list"
                          aria-labelledby={`${service.slug}-deliverables`}
                          className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-x-8"
                        >
                          {service.deliverables.map((deliverable) => (
                            <li
                              key={deliverable}
                              className="flex gap-3 text-sm leading-relaxed"
                            >
                              <CheckIcon
                                className="mt-0.5 size-4 shrink-0 text-brand"
                                aria-hidden="true"
                              />
                              <span className="min-w-0">{deliverable}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}

                    {service.process.length > 0 ? (
                      <>
                        <p
                          id={`${service.slug}-process`}
                          className="mt-10 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground"
                        >
                          How it runs
                        </p>
                        {/* The visible number is decorative: an `ol` already
                          announces position, so reading it twice adds noise. */}
                        <ol
                          role="list"
                          aria-labelledby={`${service.slug}-process`}
                          className="mt-4 space-y-5"
                        >
                          {service.process.map((step, index) => (
                            <li key={step.title} className="flex gap-4">
                              <span
                                aria-hidden="true"
                                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border font-mono text-xs text-muted-foreground"
                              >
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium">
                                  {step.title}
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                  {step.detail}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </>
                    ) : null}
                  </CardContent>
                </div>
              </Card>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
