import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { SectionLink } from "@/components/primitives/SectionLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getServices } from "@/content";
import { enquiryHref } from "@/lib/links";

/* How many of a service's first list to show here. The full lists live at
   `/services`; repeating them would put the same content on two URLs and
   cost the home page the scroll it has to earn. */
const PREVIEW_ITEMS = 4;

export function Services() {
  const services = getServices();

  if (services.length === 0) {
    return null;
  }

  return (
    <Section
      id="services"
      label="Services"
      heading="What I Can Build"
      lead="Whether you need a professional website, custom business software or a new SaaS product, I can help turn the idea into a production-ready application."
    >
      <ul role="list" className="grid gap-6 md:grid-cols-2">
        {services.map((service) => {
          const [preview] = service.lists;

          return (
            <li key={service.slug} className="min-w-0">
              <Reveal className="h-full">
                <Card className="h-full [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
                  <CardContent className="flex h-full min-w-0 flex-col">
                    <h3 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                      {service.name}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                      {service.summary}
                    </p>
                    {preview !== undefined && preview.items.length > 0 ? (
                      <>
                        <p
                          id={`${service.slug}-preview`}
                          className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground"
                        >
                          {preview.label}
                        </p>
                        <ul
                          role="list"
                          aria-labelledby={`${service.slug}-preview`}
                          className="mt-3 space-y-2"
                        >
                          {preview.items.slice(0, PREVIEW_ITEMS).map((item) => (
                            <li key={item} className="flex gap-3 text-sm">
                              <CheckIcon
                                className="mt-0.5 size-4 shrink-0 text-brand"
                                aria-hidden="true"
                              />
                              <span className="min-w-0">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    <div className="mt-auto pt-8">
                      <Button
                        asChild
                        variant="outline"
                        className="h-10 gap-2 px-4"
                      >
                        <Link href={enquiryHref(service.enquiryType)}>
                          {service.cta}
                          <ArrowRightIcon className="size-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            </li>
          );
        })}
      </ul>
      <SectionLink href="/services">See every service in detail</SectionLink>
    </Section>
  );
}
