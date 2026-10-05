import { Fragment } from "react";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { StatusPill } from "@/components/primitives/StatusPill";
import { HeroShowcase } from "@/components/sections/HeroShowcase";
import { TechMarquee } from "@/components/sections/TechMarquee";
import { Button } from "@/components/ui/button";
import { getProfile, getTechnologyMarks } from "@/content";
import { emphasise, headlineLines } from "@/lib/headline";

/* Nothing in the hero is wrapped in Reveal. Reveal server-renders opacity 0,
   so its children are invisible until JavaScript runs. That is a fine trade
   for decoration below the fold; it is not one for the headline, for the
   primary call to action on a page whose only job is turning a visitor into an
   enquiry, or for the showcase, which is the largest element above the fold on
   a desktop and has its own first-paint entrance instead. */
export function Hero() {
  const profile = getProfile();
  const marks = getTechnologyMarks();

  /* Fills the screen below the sticky header, with the content centred in what
     is left. `svh` rather than `vh` or `dvh`: `vh` ignores mobile browser
     chrome and pushes the call to action under it, and `dvh` makes the hero
     resize while the URL bar hides, which moves the headline as you scroll.
     `4rem` is the header's `h-16`.

     It is a minimum, not a fixed height. On a phone the stacked headline, bio,
     buttons, marquee and showcase are taller than the screen anyway, so the
     rule simply stops applying rather than clipping anything.

     The bottom padding still matches `Section`'s so the hero joins the page
     rhythm; the top is its own, because nothing sits above it. */
  return (
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden pt-14 pb-12 sm:pt-20 sm:pb-14 lg:pb-16">
      {/* Sits behind the showcase and lifts its top edge off the page. Clipped
          by the section, so it cannot widen the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-40 -z-10 size-136 rounded-full blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--brand) 55%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* About 52/48. The showcase is the evidence, so it gets nearly half
            the width instead of the fixed 25rem the code card had. */}
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <StatusPill status={profile.availability.status} />
              {/* The location rather than the availability detail: the pill
                  already says available, and Wellington is what a New
                  Zealand or Australian visitor is checking for. */}
              <span className="text-sm text-muted-foreground">
                {profile.location}
              </span>
            </div>

            {/* The largest contentful element. Never animated, never starting
                from opacity 0, and the only place a visitor confirms whose
                site this is, because the header carries the mark alone.

                One line per sentence, and the headline is one sentence, so it
                wraps naturally under `text-balance` instead of breaking at a
                full stop. The sizes were set for the earlier two-sentence
                headline; re-measure them if the wrap ever leaves a single word
                on a line. The space between the lines keeps sentences apart in
                the heading's accessible name. */}
            <h1 className="mt-7">
              {/* The name stays in the heading because the header carries the
                  mark alone. */}
              <span className="block font-mono text-sm uppercase tracking-[0.22em] text-brand">
                {profile.name} · {profile.role}
              </span>{" "}
              <span className="mt-4 block text-balance font-heading text-[clamp(1.45rem,7vw,2rem)] font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[2.5rem] xl:text-[3.125rem]">
                {headlineLines(profile.headline).map((line, index) => (
                  <Fragment key={line}>
                    {index > 0 ? " " : null}
                    <span className="block">
                      {emphasise(line, profile.headlineEmphasis).map(
                        (segment, position) =>
                          segment.emphasis ? (
                            /* Gradient text is transparent text over a clipped
                               background, so anything that drops backgrounds
                               would leave a hole: printing, and forced colours.
                               Both fall back to the heading's own colour.
                               `box-decoration-clone` gives each line its own
                               full gradient if the phrase ever wraps. */
                            <span
                              key={position}
                              className="box-decoration-clone bg-linear-to-r from-highlight-start to-highlight-end bg-clip-text text-transparent print:bg-none print:text-inherit forced-colors:bg-none forced-colors:text-[CanvasText]"
                            >
                              {segment.text}
                            </span>
                          ) : (
                            <Fragment key={position}>{segment.text}</Fragment>
                          ),
                      )}
                    </span>
                  </Fragment>
                ))}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {profile.shortBio}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild className="h-11 gap-2 px-5 text-[0.95rem]">
                <Link href="/contact">
                  Start a Project
                  <ArrowUpRightIcon className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 px-5 text-[0.95rem]"
              >
                <Link href="#work">View My Work</Link>
              </Button>
            </div>

            <p className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {profile.primaryStack.join(" · ")}
            </p>

            {marks.length > 0 ? (
              <TechMarquee
                marks={marks.map(({ name, icon }) => ({ name, icon }))}
              />
            ) : null}
          </div>

          {/* Auto width, not `w-full`, so the negative margin widens it: a
              grid item stretches to its area less its margins. Below `lg` it
              stacks under the copy, capped so a tablet does not get a 600px
              tall picture. From `lg` it runs into the page gutter: the light
              card stops short of the edge, the dark render reaches it. The
              calc is the gutter, container padding included. */}
          <HeroShowcase className="max-w-2xl lg:-mr-8 lg:max-w-none xl:-mr-16 lg:dark:-mr-[calc(max(0px,(100vw-72rem)/2)+2rem)]" />
        </div>
      </div>
    </section>
  );
}
