import { describe, expect, it } from "vitest";
import { getDb } from "@/db";
import { ConflictError, NotFoundError } from "@/lib/permissions";
import { clientInputSchema, type ClientInput } from "@/lib/validation/client";
import { archiveClient, createClient, updateClient } from "@/server/services/clients";
import { OWNER_A, OWNER_B } from "../../support/database";

const input: ClientInput = {
  name: "  Aroha Ngata ",
  email: "Aroha@Example.CO.NZ",
  companyName: "Kōwhai Studio",
  countryCode: "nz",
  defaultCurrency: "NZD",
  notes: "",
};

const values = (overrides: Partial<ClientInput> = {}) => clientInputSchema.parse({ ...input, ...overrides });

const activitiesFor = (clientId: string) =>
  getDb().activity.findMany({ where: { clientId }, orderBy: { occurredAt: "asc" } });

describe("createClient", () => {
  it("stores normalized values and exactly one client_created activity", async () => {
    const { id } = await createClient(OWNER_A, values());

    const client = await getDb().client.findUniqueOrThrow({ where: { id } });
    expect(client).toMatchObject({
      ownerId: OWNER_A,
      name: "Aroha Ngata",
      email: "aroha@example.co.nz",
      countryCode: "NZ",
      notes: null,
      archivedAt: null,
      stripeCustomerId: null,
    });

    const activities = await activitiesFor(id);
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      ownerId: OWNER_A,
      type: "client_created",
      actor: "owner",
      summary: "Created client Kōwhai Studio",
      data: {},
    });
  });

  it("falls back to the contact name when there is no company", async () => {
    const { id } = await createClient(OWNER_A, values({ companyName: "" }));
    expect((await activitiesFor(id))[0].summary).toBe("Created client Aroha Ngata");
  });
});

describe("updateClient", () => {
  it("writes client_updated with only the changed field keys, in form order", async () => {
    const { id } = await createClient(OWNER_A, values());
    await updateClient(OWNER_A, id, values({ notes: "Prefers email.", email: "kia.ora@example.co.nz" }));

    const client = await getDb().client.findUniqueOrThrow({ where: { id } });
    expect(client).toMatchObject({ email: "kia.ora@example.co.nz", notes: "Prefers email." });

    const activities = await activitiesFor(id);
    expect(activities).toHaveLength(2);
    expect(activities[1]).toMatchObject({
      type: "client_updated",
      summary: "Updated client Kōwhai Studio",
      data: { changedFields: ["email", "notes"] },
    });
  });

  it("writes nothing for an unchanged save", async () => {
    const { id } = await createClient(OWNER_A, values());
    const before = await getDb().client.findUniqueOrThrow({ where: { id } });

    await expect(updateClient(OWNER_A, id, values())).resolves.toEqual({ id });

    const after = await getDb().client.findUniqueOrThrow({ where: { id } });
    expect(after.updatedAt).toEqual(before.updatedAt);
    expect(await activitiesFor(id)).toHaveLength(1);
  });

  it("refuses to change an archived client", async () => {
    const { id } = await createClient(OWNER_A, values());
    await archiveClient(OWNER_A, id);

    await expect(updateClient(OWNER_A, id, values({ name: "Someone Else" }))).rejects.toBeInstanceOf(ConflictError);
    expect((await getDb().client.findUniqueOrThrow({ where: { id } })).name).toBe("Aroha Ngata");
  });
});

describe("archiveClient", () => {
  it("archives once and records one activity, even when repeated", async () => {
    const { id } = await createClient(OWNER_A, values());

    await archiveClient(OWNER_A, id);
    const first = await getDb().client.findUniqueOrThrow({ where: { id } });
    expect(first.archivedAt).toBeInstanceOf(Date);

    await expect(archiveClient(OWNER_A, id)).resolves.toEqual({ id });
    const second = await getDb().client.findUniqueOrThrow({ where: { id } });
    expect(second.archivedAt).toEqual(first.archivedAt);

    const types = (await activitiesFor(id)).map(({ type }) => type);
    expect(types).toEqual(["client_created", "client_archived"]);
  });
});

describe("ownership", () => {
  it("gives owner B NotFoundError for owner A's client and leaves it unchanged", async () => {
    const { id } = await createClient(OWNER_A, values());
    const before = await getDb().client.findUniqueOrThrow({ where: { id } });

    await expect(updateClient(OWNER_B, id, values({ name: "Taken Over" }))).rejects.toBeInstanceOf(NotFoundError);
    await expect(archiveClient(OWNER_B, id)).rejects.toBeInstanceOf(NotFoundError);

    expect(await getDb().client.findUniqueOrThrow({ where: { id } })).toEqual(before);
    expect(await activitiesFor(id)).toHaveLength(1);
    expect(await getDb().activity.count({ where: { ownerId: OWNER_B } })).toBe(0);
  });

  it("treats missing and malformed ids like another owner's", async () => {
    await expect(updateClient(OWNER_A, "11111111-1111-4111-8111-111111111111", values())).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(archiveClient(OWNER_A, "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
  });
});
