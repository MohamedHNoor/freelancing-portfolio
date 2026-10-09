import "server-only";
import { notFound } from "next/navigation";
import { NotFoundError } from "@/lib/permissions";
import { getProjectView, type ProjectView } from "@/server/queries/projects";

/** The project for a page: missing, malformed and other owners' ids all become the scoped 404. */
export async function loadProjectOrNotFound(ownerId: string, projectId: string): Promise<ProjectView> {
  try {
    return await getProjectView(ownerId, projectId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}
