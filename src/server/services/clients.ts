import "server-only";
import { getDb } from "@/db";
import { ConflictError, ownedClient } from "@/lib/permissions";
import { CLIENT_FIELDS, type ClientValues } from "@/lib/validation/client";
import { recordActivity } from "@/server/services/activity";

function displayName({ companyName, name }: { companyName: string | null; name: string }): string {
  return companyName ?? name;
}

export async function createClient(ownerId: string, values: ClientValues): Promise<{ id: string }> {
  return getDb().$transaction(async (tx) => {
    const { id } = await tx.client.create({ data: { ...values, ownerId }, select: { id: true } });
    await recordActivity(tx, {
      ownerId,
      clientId: id,
      actor: "owner",
      type: "client_created",
      data: {},
      summary: `Created client ${displayName(values)}`,
    });
    return { id };
  });
}

/** Saves changed fields only. An archived client cannot change; an unchanged save writes nothing. */
export async function updateClient(ownerId: string, clientId: string, values: ClientValues): Promise<{ id: string }> {
  return getDb().$transaction(async (tx) => {
    const current = await ownedClient(tx, ownerId, clientId, { forUpdate: true });
    if (current.archivedAt !== null) throw new ConflictError();

    const changedFields = CLIENT_FIELDS.filter((field) => current[field] !== values[field]);
    const [first, ...rest] = changedFields;
    if (first === undefined) return { id: current.id };

    await tx.client.update({ where: { id: current.id }, data: values });
    await recordActivity(tx, {
      ownerId,
      clientId: current.id,
      actor: "owner",
      type: "client_updated",
      data: { changedFields: [first, ...rest] },
      summary: `Updated client ${displayName(values)}`,
    });
    return { id: current.id };
  });
}

/** Soft-deletes a client. Archiving an archived client succeeds without a second record. */
export async function archiveClient(ownerId: string, clientId: string): Promise<{ id: string }> {
  return getDb().$transaction(async (tx) => {
    const current = await ownedClient(tx, ownerId, clientId, { forUpdate: true });
    if (current.archivedAt !== null) return { id: current.id };

    const { count } = await tx.client.updateMany({
      where: { id: current.id, ownerId, archivedAt: null },
      data: { archivedAt: new Date() },
    });
    if (count !== 1) throw new ConflictError();

    await recordActivity(tx, {
      ownerId,
      clientId: current.id,
      actor: "owner",
      type: "client_archived",
      data: {},
      summary: `Archived client ${displayName(current)}`,
    });
    return { id: current.id };
  });
}
