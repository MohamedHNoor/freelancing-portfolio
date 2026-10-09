import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { DeleteProjectButton } from "@/components/dashboard/projects/DeleteProjectButton";
import { ProjectDetailsForm } from "@/components/dashboard/projects/ProjectForm";
import { ProjectStatusActions, STATUS_HEADING_ID } from "@/components/dashboard/projects/ProjectStatusActions";
import { ProjectStatusBadge } from "@/components/dashboard/projects/ProjectStatusBadge";
import { projectFormValues, projectStatusActions } from "@/lib/dashboard/projects";
import { EDITABLE_PROJECT_STATUSES } from "@/lib/state/project";
import { requireOwner } from "@/server/auth/session";
import { loadProjectOrNotFound } from "@/server/queries/load-project";

export const metadata: Metadata = { title: "Project settings" };

export default async function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { userId } = await requireOwner();
  const { projectId } = await params;
  const project = await loadProjectOrNotFound(userId, projectId);
  const editable = EDITABLE_PROJECT_STATUSES.includes(project.status);
  const options = projectStatusActions(project.status, project);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="inline-flex min-h-11 items-center gap-2 rounded text-workspace-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        <span className="break-words">{project.name}</span>
      </Link>
      <div className="space-y-2">
        <h1 className="font-heading text-workspace-title font-semibold tracking-tight">Project settings</h1>
        <p className="text-workspace-body leading-relaxed text-muted-foreground">
          Details, status and deletion for {project.name}. Its client, {project.client.displayName}, is fixed.
        </p>
      </div>

      <section aria-labelledby={STATUS_HEADING_ID} className="workspace-surface space-y-5 rounded-2xl border border-border bg-card px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id={STATUS_HEADING_ID} tabIndex={-1} className="rounded font-heading text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Status
          </h2>
          <ProjectStatusBadge status={project.status} />
        </div>
        <ProjectStatusActions projectId={project.id} projectName={project.name} options={options} />
      </section>

      {editable ? (
        <ProjectDetailsForm projectId={project.id} defaultValues={projectFormValues(project)} />
      ) : (
        <p className="rounded-lg bg-info-soft p-4 text-workspace-body leading-relaxed text-info">
          {project.status === "completed"
            ? "A completed project's details and plan are locked. Reopen it to change them."
            : "A cancelled project's details and plan are locked."}
        </p>
      )}

      {project.status === "draft" && (
        <section aria-labelledby="delete-heading" className="space-y-4 rounded-2xl border border-destructive/30 px-5 py-6 sm:px-8">
          <div className="space-y-1">
            <h2 id="delete-heading" className="font-heading text-lg font-semibold">Delete this draft</h2>
            <p className="text-workspace-body text-muted-foreground">
              Only a draft can be deleted. Once a project is active, cancel it instead.
            </p>
          </div>
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </section>
      )}
    </div>
  );
}
