import { getDb } from "@/db";
import { projectInputSchema, type ProjectInput } from "@/lib/validation/project";
import { createProject } from "@/server/services/projects";

/** An active client of `ownerId`. */
export async function seedClient(ownerId: string, overrides: { archivedAt?: Date } = {}): Promise<string> {
  const { id } = await getDb().client.create({
    data: { ownerId, name: "Aroha Ngata", email: "aroha@example.com", defaultCurrency: "NZD", ...overrides },
    select: { id: true },
  });
  return id;
}

/** A draft project created through the service, so it carries its activity. */
export async function seedProject(
  ownerId: string,
  overrides: Partial<ProjectInput> = {},
): Promise<{ clientId: string; projectId: string }> {
  const clientId = overrides.clientId ?? (await seedClient(ownerId));
  const values = projectInputSchema.parse({
    clientId,
    name: "Acme website",
    currency: "NZD",
    total: "50,000.00",
    ...overrides,
  });
  const { projectId } = await createProject(ownerId, values);
  return { clientId, projectId };
}

/** The project's milestones in plan order, with amounts as numbers. */
export async function planOf(projectId: string) {
  const rows = await getDb().milestone.findMany({ where: { projectId }, orderBy: { position: "asc" } });
  return rows.map((row) => ({ ...row, amountMinor: Number(row.amountMinor) }));
}

export const activitiesOf = (projectId: string) =>
  getDb().activity.findMany({ where: { projectId }, orderBy: { occurredAt: "asc" } });
