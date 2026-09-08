import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Reveal } from "@/components/primitives/Reveal";
import { StatusPill } from "@/components/primitives/StatusPill";
import { HeroCodeCard } from "@/components/sections/HeroCodeCard";
import { Button } from "@/components/ui/button";
import { TechIcon } from "@/components/icons/TechIcon";
import { getProfile, getTechnologyMarks } from "@/content";
import { cn } from "@/lib/utils";
import type { Skill } from "@/types/content";

/* Nothing in the left column is wrapped in Reveal. Reveal server-renders
   opacity 0, so its children are invisible until JavaScript runs. That is a
   fine trade for decoration below the fold; it is not one for the headline or
   for the primary call to action on a page whose only job is turning a visitor
   into an enquiry. The code card is the one hero element with an entrance, and
   it is decorative. */
export function Hero() {
  const profile = getProfile();
  const marks = getTechnologyMarks();

  /* The bottom padding matches `Section`'s so the hero joins the page rhythm;
     the top is its own, because nothing sits above it. */
  return (
    <section className="relative isolate overflow-hidden pt-14 pb-12 sm:pt-20 sm:pb-14 lg:pb-16">
      {/* Anchors the right column the way the reference uses a glow behind the
          portrait. Clipped by the section, so it cannot widen the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-8rem] right-[-10rem] -z-10 size-[34rem] rounded-full blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--brand) 55%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:gap-16">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <StatusPill status={profile.availability.status} />
              {profile.availability.detail ? (
                <span className="text-sm text-muted-foreground">
                  {profile.availability.detail}
                </span>
              ) : null}
            </div>

            {/* The largest contentful element. Never animated, never starting
                from opacity 0, and the only place a visitor confirms whose
                site this is, because the header carries the mark alone. */}
            <h1 className="mt-7">
              <span className="block font-mono text-sm uppercase tracking-[0.22em] text-brand">
                {profile.name}
              </span>{" "}
              <span className="mt-4 block text-balance font-heading text-[clamp(1.55rem,7.5vw,2rem)] font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[2.6rem] xl:text-[3.25rem]">
                {profile.headline}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {profile.shortBio}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild className="h-11 gap-2 px-5 text-[0.95rem]">
                <Link href="#contact">
                  Start a project
                  <ArrowUpRightIcon className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 px-5 text-[0.95rem]"
              >
                <Link href="#projects">See case studies</Link>
              </Button>
            </div>

            {marks.length > 0 ? (
              <div className="mt-12">
                <p
                  id="hero-stack-label"
                  className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Working with
                </p>
                {/* Two identical copies scrolled by exactly one copy width, so
                    the loop is seamless. Reduced motion stops the scroll and
                    wraps the single visible copy instead, and hovering pauses
                    it for anyone who wants to read a specific mark. */}
                <div className="relative mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] motion-reduce:[mask-image:none]">
                  <div className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:flex-wrap">
                    <TechRow marks={marks} labelledBy="hero-stack-label" />
                    <TechRow marks={marks} duplicate />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <Reveal delay={0.15} className="min-w-0">
            <HeroCodeCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

type TechRowProps = {
  marks: readonly Skill[];
  labelledBy?: string;
  /** The second copy exists only to make the scroll loop seamless, so it is
   *  hidden from assistive technology and removed under reduced motion. */
  duplicate?: boolean;
};

function TechRow({ marks, labelledBy, duplicate = false }: TechRowProps) {
  return (
    <ul
      aria-labelledby={labelledBy}
      aria-hidden={duplicate || undefined}
      className={cn(
        "flex shrink-0 gap-2 pr-2",
        duplicate
          ? "motion-reduce:hidden"
          : "motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:gap-y-2",
      )}
    >
      {marks.map((skill) => (
        <li
          key={skill.name}
          className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"
        >
          {skill.icon ? (
            <TechIcon icon={skill.icon} className="size-3.5 shrink-0" />
          ) : null}
          {skill.name}
        </li>
      ))}
    </ul>
  );
}
