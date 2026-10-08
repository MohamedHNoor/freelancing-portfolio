import { describe, expect, it } from "vitest";
import { NotFoundError } from "@/lib/permissions";
import { clientInputSchema } from "@/lib/validation/client";
import { CLIENT_ACTIVITY_LIMIT, listClientActivity } from "@/server/queries/activity";
import { getClient, listClients } from "@/server/queries/clients";
import { archiveClient, createClient, updateClient } from "@/server/services/clients";
import { OWNER_A, OWNER_B } from "../../support/database";

const values = (name: string) =>
  clientInputSchema.parse({ name, email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`, defaultCurrency: "AUD" });

describe("listClients", () => {
  it("returns only the caller's clients, split into active and archived, by name", async () => {
    const zed = await createClient(OWNER_A, values("Zed"));
    await createClient(OWNER_A, values("Amara"));
    const mid = await createClient(OWNER_A, values("Mika"));
    await createClient(OWNER_B, values("Bea"));
    await archiveClient(OWNER_A, mid.id);

    const active = await listClients(OWNER_A, { archived: false });
    expect(active.map(({ name }) => name)).toEqual(["Amara", "Zed"]);
    expect(active[1]).toEqual({
      id: zed.id,
      name: "Zed",
      companyName: null,
      email: "zed@example.com",
      countryCode: null,
      defaultCurrency: "AUD",
      archivedAt: null,
    });

    const archived = await listClients(OWNER_A, { archived: true });
    expect(archived.map(({ name }) => name)).toEqual(["Mika"]);

    expect((await listClients(OWNER_B, { archived: false })).map(({ name }) => name)).toEqual(["Bea"]);
  });
});

describe("getClient", () => {
  it("returns the owner's client and hides it from anyone else", async () => {
    const { id } = await createClient(OWNER_A, values("Amara"));

    expect((await getClient(OWNER_A, id)).name).toBe("Amara");
    await expect(getClient(OWNER_B, id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getClient(OWNER_A, "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("listClientActivity", () => {
  it("lists the client's activity newest first", async () => {
    const { id } = await createClient(OWNER_A, values("Amara"));
    await updateClient(OWNER_A, id, values("Amaru"));
    await archiveClient(OWNER_A, id);

    const activity = await listClientActivity(OWNER_A, id);
    expect(activity.map(({ type }) => type)).toEqual(["client_archived", "client_updated", "client_created"]);
    expect(Object.keys(activity[0]).sort()).toEqual(["id", "occurredAt", "summary", "type"]);
  });

  it(`returns at most ${CLIENT_ACTIVITY_LIMIT} entries`, async () => {
    const { id } = await createClient(OWNER_A, values("Amara"));
    for (let index = 0; index < CLIENT_ACTIVITY_LIMIT; index += 1) {
      await updateClient(OWNER_A, id, values(`Amara ${index}`));
    }

    const activity = await listClientActivity(OWNER_A, id);
    expect(activity).toHaveLength(CLIENT_ACTIVITY_LIMIT);
    expect(activity[0].summary).toBe(`Updated client Amara ${CLIENT_ACTIVITY_LIMIT - 1}`);
    expect(activity.some(({ type }) => type === "client_created")).toBe(false);
  });

  it("gives owner B NotFoundError", async () => {
    const { id } = await createClient(OWNER_A, values("Amara"));
    await expect(listClientActivity(OWNER_B, id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
