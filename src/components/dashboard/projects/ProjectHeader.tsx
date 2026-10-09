import Link from "next/link";
import { ArrowLeftIcon, SettingsIcon } from "lucide-react";
import { ProjectStatusBadge } from "@/components/dashboard/projects/ProjectStatusBadge";
import { Button } from "@/components/ui/button";
import { formatCalendarDate } from "@/lib/dashboard/projects";
import { CURRENCY_NAMES } from "@/lib/money";
import type { ProjectView } from "@/server/queries/projects";

function DateText({ value }: { value: string }) {
  return <time dateTime={value}>{formatCalendarDate(value)}</time>;
}

/** The project's name, status, client, currency and dates, with a link to its settings. */
export function ProjectHeader({ project }: { project: ProjectView }) {
  const { startDate, expectedEndDate } = project;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/projects"
        className="inline-flex min-h-11 items-center gap-2 rounded text-workspace-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Projects
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="break-words font-heading text-workspace-title font-semibold tracking-tight">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-workspace-body text-muted-foreground">
            <Link
              href={`/dashboard/clients/${project.client.id}`}
              className="rounded text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {project.client.displayName}
            </Link>
            <span aria-hidden="true">·</span>
            <abbr title={CURRENCY_NAMES[project.currency]} className="font-mono no-underline">{project.currency}</abbr>
            {(startDate || expectedEndDate) && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  {startDate && expectedEndDate ? (
                    <>
                      <DateText value={startDate} /> to <DateText value={expectedEndDate} />
                    </>
                  ) : startDate ? (
                    <>Starts <DateText value={startDate} /></>
                  ) : (
                    expectedEndDate && <>Due <DateText value={expectedEndDate} /></>
                  )}
                </span>
              </>
            )}
          </p>
        </div>
        <Button asChild variant="outline" className="min-h-11 px-4">
          <Link href={`/dashboard/projects/${project.id}/settings`}>
            <SettingsIcon className="size-4" aria-hidden="true" />
            Settings
          </Link>
        </Button>
      </div>
    </div>
  );
}
