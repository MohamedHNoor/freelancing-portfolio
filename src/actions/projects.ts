"use server";

import { z } from "zod";
import { projectInputSchema, projectStatusActionSchema, projectUpdateSchema } from "@/lib/validation/project";
import { ownerAction } from "@/server/owner-action";
import { revalidateProject } from "@/server/revalidate";
import * as projects from "@/server/services/projects";
import type { ActionResult } from "@/types/action";

const messages = {
  NOT_FOUND: "That project could not be found.",
  CONFLICT: "That change is no longer possible for this project.",
};

type ProjectResult = ActionResult<{ projectId: string }>;

export async function createProject(raw: unknown): Promise<ProjectResult> {
  return ownerAction({ label: ["projects", "createProject"], schema: projectInputSchema, messages }, raw, async ({ owner }, values) => {
    const result = await projects.createProject(owner.userId, values);
    revalidateProject(result);
    return { projectId: result.projectId };
  });
}

export async function updateProject(projectId: unknown, raw: unknown): Promise<ProjectResult> {
  return ownerAction(
    { label: ["projects", "updateProject"], schema: projectUpdateSchema, id: projectId, messages },
    raw,
    async ({ owner, id }, values) => {
      revalidateProject(await projects.updateProject(owner.userId, id, values));
      return { projectId: id };
    },
  );
}

export async function changeProjectStatus(projectId: unknown, raw: unknown): Promise<ProjectResult> {
  return ownerAction(
    { label: ["projects", "changeProjectStatus"], schema: projectStatusActionSchema, id: projectId, messages },
    raw,
    async ({ owner, id }, { action }) => {
      revalidateProject(await projects.changeProjectStatus(owner.userId, id, action));
      return { projectId: id };
    },
  );
}

export async function deleteProject(projectId: unknown): Promise<ProjectResult> {
  return ownerAction(
    { label: ["projects", "deleteProject"], schema: z.undefined(), id: projectId, messages },
    undefined,
    async ({ owner, id }) => {
      revalidateProject(await projects.deleteProject(owner.userId, id));
      return { projectId: id };
    },
  );
}
