import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanbanIcon, PlusIcon } from "lucide-react";
import { ProjectTable } from "@/components/dashboard/projects/ProjectTable";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { PROJECT_STATUS_LABELS, parseProjectStatusFilter, type ProjectStatusFilter } from "@/lib/dashboard/projects";
import { cn } from "@/lib/utils";
import { PROJECT_STATUSES } from "@/lib/validation/project";
import { requireOwner } from "@/server/auth/session";
import { listProjects } from "@/server/queries/projects";

export const metadata: Metadata = { title: "Projects" };

const TABS: { status: ProjectStatusFilter; label: string; href: string }[] = [
  { status: "all", label: "All", href: "/dashboard/projects" },
  ...PROJECT_STATUSES.map((status) => ({
    status,
    label: PROJECT_STATUS_LABELS[status],
    href: `/dashboard/projects?status=${status}`,
  })),
];

function NewProjectButton({ variant = "default" }: { variant?: "default" | "outline" }) {
  return (
    <Button asChild variant={variant} className="min-h-11 px-4">
      <Link href="/dashboard/projects/new">
        <PlusIcon className="size-4" aria-hidden="true" />
        New project
      </Link>
    </Button>
  );
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { userId } = await requireOwner();
  const status = parseProjectStatusFilter((await searchParams).status);
  const projects = await listProjects(userId, { status });
  const current = TABS.find((tab) => tab.status === status) ?? TABS[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-heading text-workspace-title font-semibold tracking-tight">Projects</h1>
          <p className="max-w-xl text-workspace-body leading-relaxed text-muted-foreground">
            Agreed work for your clients, each with a milestone payment plan.
          </p>
        </div>
        <NewProjectButton />
      </div>

      <nav aria-label="Project status">
        <ul className="flex flex-wrap gap-2 text-workspace-sm">
          {TABS.map((tab) => (
            <li key={tab.status}>
              <Link
                href={tab.href}
                aria-current={tab.status === status ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-lg px-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  tab.status === status
                    ? "bg-primary/10 font-medium text-brand ring-1 ring-inset ring-primary/15"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {projects.length > 0 ? (
        <ProjectTable rows={projects} caption={status === "all" ? "All projects" : `${current.label} projects`} />
      ) : status === "all" ? (
        <EmptyState
          Icon={FolderKanbanIcon}
          title="No projects yet"
          description="Create a project for a client with its total and a milestone payment plan."
        >
          <NewProjectButton />
        </EmptyState>
      ) : (
        <EmptyState
          Icon={FolderKanbanIcon}
          title={`No ${current.label.toLowerCase()} projects`}
          description="Projects with this status appear here."
        >
          <Button asChild variant="outline" className="min-h-11 px-4">
            <Link href="/dashboard/projects">View all projects</Link>
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
