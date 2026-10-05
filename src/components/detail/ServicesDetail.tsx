import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { getServices } from "@/content";
import { enquiryHref } from "@/lib/links";

/* The full version of the home section: every list each service carries, the
   timeline where one has been promised, and the service's own call to action.
   Order comes from `getServices()`, which sorts by `order`, so nothing sorts
   here.

   No `Reveal`. On this page the content is the reason to be here, and Reveal
   server-renders `opacity: 0`. */
export function ServicesDetail() {
  const services = getServices();

  if (services.length === 0) {
    return null;
  }

  return (
    <ul role="list" className="space-y-8">
      {services.map((service) => (
        <li key={service.slug}>
          <Card className="[--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-0">
              <CardHeader className="min-w-0 content-start gap-2 lg:pr-10">
                <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                  {service.name}
                </h2>
                <CardDescription className="leading-relaxed">
                  {service.summary}
                </CardDescription>
                {service.typicalTimeline !== undefined ? (
                  <dl className="mt-6">
                    <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Typical timeline
                    </dt>
                    <dd className="mt-2 text-sm">{service.typicalTimeline}</dd>
                  </dl>
                ) : null}
                <div className="mt-6">
                  <Button asChild className="h-10 gap-2 px-4">
                    <Link href={enquiryHref(service.enquiryType)}>
                      {service.cta}
                      <ArrowRightIcon className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="min-w-0 space-y-8 lg:border-l lg:border-border lg:pl-10">
                {service.lists.map((list, index) => {
                  const labelId = `${service.slug}-list-${index}`;

                  return (
                    <div key={list.label}>
                      <p
                        id={labelId}
                        className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        {list.label}
                      </p>
                      <ul
                        role="list"
                        aria-labelledby={labelId}
                        className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-x-8"
                      >
                        {list.items.map((item) => (
                          <li
                            key={item}
                            className="flex gap-3 text-sm leading-relaxed"
                          >
                            <CheckIcon
                              className="mt-0.5 size-4 shrink-0 text-brand"
                              aria-hidden="true"
                            />
                            <span className="min-w-0">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </CardContent>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
