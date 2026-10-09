"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon } from "lucide-react";
import { changeProjectStatus } from "@/actions/projects";
import { ConfirmDialog } from "@/components/dashboard/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import type { ProjectStatusActionOption } from "@/lib/dashboard/projects";
import type { ProjectStatusAction } from "@/lib/validation/project";

/** The id of the status section's heading, which takes focus after a change. */
export const STATUS_HEADING_ID = "status-heading";

const STATUS_CHANGED: Record<ProjectStatusAction, string> = {
  activate: "Project activated.",
  pause: "Project put on hold.",
  resume: "Project resumed.",
  complete: "Project marked complete.",
  reopen: "Project reopened.",
  cancel: "Project cancelled.",
};

/** The status changes valid from the project's current status, from `projectStatusActions` on the server. */
export function ProjectStatusActions({
  projectId,
  projectName,
  options,
}: {
  projectId: string;
  projectName: string;
  options: ProjectStatusActionOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<ProjectStatusAction | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const changed = useRef(false);

  // The clicked button is replaced by the next status's actions, so once they
  // render, focus moves to the section heading.
  useEffect(() => {
    if (!changed.current) return;
    changed.current = false;
    document.getElementById(STATUS_HEADING_ID)?.focus();
  }, [options]);

  async function change(action: ProjectStatusAction): Promise<string | null> {
    setAnnouncement("");
    const result = await changeProjectStatus(projectId, { action });
    if (!result.success) return result.error.message;
    changed.current = true;
    setAnnouncement(STATUS_CHANGED[action]);
    router.refresh();
    return null;
  }

  function run(action: ProjectStatusAction) {
    if (pending) return;
    setFailure(null);
    setRunning(action);
    startTransition(async () => {
      setFailure(await change(action));
      setRunning(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Stays mounted while the actions below change, so the announcement is read. */}
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
      {options.length === 0 && (
        <p className="text-workspace-body text-muted-foreground">A cancelled project&apos;s status can&apos;t change.</p>
      )}
      <ul className="space-y-3">
        {options.map((option) =>
          <li key={option.action} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {option.action === "cancel" ? (
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="destructive" className="min-h-11 px-4 sm:min-w-48" disabled={pending}>
                    {option.label}
                  </Button>
                }
                title={`Cancel ${projectName}?`}
                description="The project stops and its plan can no longer change. This can't be undone."
                confirmLabel="Cancel project"
                pendingLabel="Cancelling…"
                destructive
                onConfirm={() => change("cancel")}
              />
            ) : (
              <Button
                type="button"
                variant={option.action === "activate" || option.action === "complete" ? "default" : "outline"}
                className="min-h-11 px-4 sm:min-w-48"
                disabled={pending || option.disabledReason !== null}
                aria-describedby={option.disabledReason ? `status-reason-${option.action}` : undefined}
                onClick={() => run(option.action)}
              >
                {running === option.action && <LoaderCircleIcon className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
                {option.label}
              </Button>
            )}
            {option.disabledReason && (
              <p id={`status-reason-${option.action}`} className="text-workspace-sm text-muted-foreground">
                {option.disabledReason}
              </p>
            )}
          </li>,
        )}
      </ul>
      {failure && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-workspace-body text-danger">{failure}</p>}
    </div>
  );
}
