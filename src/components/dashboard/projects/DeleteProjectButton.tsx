"use client";

import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { deleteProject } from "@/actions/projects";
import { ConfirmDialog } from "@/components/dashboard/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";

/** Deletes a draft project and its plan, then returns to the projects list. */
export function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      trigger={
        <Button type="button" variant="destructive" className="min-h-11 px-4">
          <Trash2Icon className="size-4" aria-hidden="true" />
          Delete draft
        </Button>
      }
      title={`Delete ${projectName}?`}
      description="The draft and its payment plan are removed permanently."
      confirmLabel="Delete draft"
      pendingLabel="Deleting…"
      destructive
      onConfirm={async () => {
        const result = await deleteProject(projectId);
        if (!result.success) return result.error.message;
        router.push("/dashboard/projects");
        router.refresh();
        return null;
      }}
    />
  );
}
