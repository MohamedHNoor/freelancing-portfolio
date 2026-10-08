import "server-only";
import type { Client, Prisma } from "@/generated/prisma/client";
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
