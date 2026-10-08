import "server-only";
import type { Client, Milestone, Prisma, Project } from "@/generated/prisma/client";
import { idSchema } from "@/lib/validation/money";

/** A record that does not exist, or belongs to another owner. Callers cannot tell which. */
export class NotFoundError extends Error {
  constructor() {
    super("Record not found.");
    this.name = "NotFoundError";
  }
}

/** A change the record's current state does not allow. */
export class ConflictError extends Error {
  constructor() {
    super("Record state does not allow this change.");
    this.name = "ConflictError";
  }
}

/** Input that only the server can judge, such as an amount in the project's currency. */
export class ValidationError extends Error {
  constructor(readonly fieldErrors: Record<string, string[]>) {
    super("Some of those details need another look.");
    this.name = "ValidationError";
  }
}

/** A transaction, or the client itself for single reads. */
export type Db = Prisma.TransactionClient;

/**
 * Loads a client only when it belongs to `ownerId`. A malformed id, a missing
 * row and another owner's row all raise the same `NotFoundError`. `forUpdate`
 * locks the row for the rest of the caller's transaction first.
 */
export async function ownedClient(
  db: Db,
  ownerId: string,
  clientId: string,
  { forUpdate = false }: { forUpdate?: boolean } = {},
): Promise<Client> {
  if (!idSchema.safeParse(clientId).success) throw new NotFoundError();

  if (forUpdate) {
    const locked = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM clients WHERE id = ${clientId}::uuid AND owner_id = ${ownerId}::uuid FOR UPDATE`;
    if (locked.length === 0) throw new NotFoundError();
  }

  const client = await db.client.findFirst({ where: { id: clientId, ownerId } });
  if (client === null) throw new NotFoundError();
  return client;
}

/** Loads a project only when it belongs to `ownerId`, with the same contract as `ownedClient`. */
export async function ownedProject(
  db: Db,
  ownerId: string,
  projectId: string,
  { forUpdate = false }: { forUpdate?: boolean } = {},
): Promise<Project> {
  if (!idSchema.safeParse(projectId).success) throw new NotFoundError();

  if (forUpdate) {
    const locked = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM projects WHERE id = ${projectId}::uuid AND owner_id = ${ownerId}::uuid FOR UPDATE`;
    if (locked.length === 0) throw new NotFoundError();
  }

  const project = await db.project.findFirst({ where: { id: projectId, ownerId } });
  if (project === null) throw new NotFoundError();
  return project;
}

export type OwnedMilestone = Milestone & { project: Project };

/**
 * Loads a milestone, with its project, only when the project belongs to
 * `ownerId`. `forUpdate` locks the **project** row: every payment-plan change
 * locks the project first, so that one lock serializes the whole plan and the
 * lock order can never invert.
 */
export async function ownedMilestone(
  db: Db,
  ownerId: string,
  milestoneId: string,
  { forUpdate = false }: { forUpdate?: boolean } = {},
): Promise<OwnedMilestone> {
  if (!idSchema.safeParse(milestoneId).success) throw new NotFoundError();

  if (forUpdate) {
    const locked = await db.$queryRaw<{ id: string }[]>`
      SELECT p.id FROM milestones m JOIN projects p ON p.id = m.project_id
      WHERE m.id = ${milestoneId}::uuid AND p.owner_id = ${ownerId}::uuid FOR UPDATE OF p`;
    if (locked.length === 0) throw new NotFoundError();
  }

  const milestone = await db.milestone.findFirst({
    where: { id: milestoneId, project: { ownerId } },
    include: { project: true },
  });
  if (milestone === null) throw new NotFoundError();
  return milestone;
}
