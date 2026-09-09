import { CheckIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { getServices } from "@/content";

/* The full panels, carrying what the home summary drops: the deliverables and
   the process steps. Order comes from `getServices()`, which sorts by `order`
   and puts the Figma track first, so nothing sorts here.

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
              {/* A real `h3`: this page's outline is h1 page, h2 nothing, h3
                  track. `CardTitle` renders a div and takes no `asChild`. */}
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
                  <dd className="mt-2 text-sm">{service.typicalTimeline}</dd>
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
                            <p className="text-sm font-medium">{step.title}</p>
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
        </li>
      ))}
    </ul>
  );
}
