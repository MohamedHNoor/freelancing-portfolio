import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError } from "@/lib/permissions";

/* Services and the session are mocked at their module boundaries. The owner
   pipeline, validation and error mapping are the real code path. */
const mocks = vi.hoisted(() => ({
  getOwner: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  archiveClient: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth/session", () => ({
  requireOwnerForAction: async () =>
    (await mocks.getOwner()) ?? {
      success: false,
      data: null,
      error: { code: "UNAUTHENTICATED", message: "Please sign in again." },
    },
}));
vi.mock("@/server/services/clients", () => ({
  createClient: mocks.createClient,
  updateClient: mocks.updateClient,
  archiveClient: mocks.archiveClient,
}));

const { archiveClient, createClient, updateClient } = await import("@/actions/clients");

const OWNER_ID = "8f6c2a3e-0b1d-4e5f-9a7b-1c2d3e4f5a6b";
const CLIENT_ID = "3f2c1b8e-9a4d-4c6e-8f1a-2b3c4d5e6f70";
const input = {
  name: "Aroha Ngata",
  email: "Private.Person@Example.co.nz",
  defaultCurrency: "NZD",
  notes: "private note",
};
let errorLog: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOwner.mockResolvedValue({ userId: OWNER_ID });
  mocks.createClient.mockResolvedValue({ id: CLIENT_ID });
  mocks.updateClient.mockResolvedValue({ id: CLIENT_ID });
  mocks.archiveClient.mockResolvedValue({ id: CLIENT_ID });
  errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorLog.mockRestore();
});

describe("client actions", () => {
  it("creates a client from normalized input for the session owner", async () => {
    await expect(createClient(input)).resolves.toEqual({ success: true, data: { clientId: CLIENT_ID }, error: null });
    expect(mocks.createClient).toHaveBeenCalledWith(
      OWNER_ID,
      expect.objectContaining({ email: "private.person@example.co.nz", phone: null }),
    );
    expect(mocks.revalidatePath.mock.calls).toEqual([["/dashboard/clients"], [`/dashboard/clients/${CLIENT_ID}`]]);
  });

  it("updates and archives the bound client id", async () => {
    await expect(updateClient(CLIENT_ID, input)).resolves.toMatchObject({ success: true, data: { clientId: CLIENT_ID } });
    expect(mocks.updateClient).toHaveBeenCalledWith(OWNER_ID, CLIENT_ID, expect.objectContaining({ name: "Aroha Ngata" }));

    await expect(archiveClient(CLIENT_ID)).resolves.toMatchObject({ success: true, data: { clientId: CLIENT_ID } });
    expect(mocks.archiveClient).toHaveBeenCalledWith(OWNER_ID, CLIENT_ID);
  });

  it("checks the owner before reading any input", async () => {
    mocks.getOwner.mockResolvedValue(null);

    for (const result of [await createClient({}), await updateClient("bad", {}), await archiveClient("bad")]) {
      expect(result).toMatchObject({ success: false, error: { code: "UNAUTHENTICATED" } });
    }
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.updateClient).not.toHaveBeenCalled();
    expect(mocks.archiveClient).not.toHaveBeenCalled();
  });

  it.each([
    ["AuthServiceError", "Auth service failed (503)."],
    ["Error", "NEON_AUTH_BASE_URL is missing."],
  ])("maps a %s from the session lookup to UNEXPECTED", async (name, message) => {
    mocks.getOwner.mockRejectedValue(Object.assign(new Error(message), { name }));

    const results = [await createClient(input), await updateClient(CLIENT_ID, input), await archiveClient(CLIENT_ID)];
    for (const result of results) {
      expect(result).toEqual({
        success: false,
        data: null,
        error: { code: "UNEXPECTED", message: "Something went wrong. Please try again in a moment." },
      });
    }
    expect(errorLog.mock.calls).toEqual([
      [`[clients] createClient failed: ${name}`],
      [`[clients] updateClient failed: ${name}`],
      [`[clients] archiveClient failed: ${name}`],
    ]);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.updateClient).not.toHaveBeenCalled();
    expect(mocks.archiveClient).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each([undefined, "not-a-uuid", 42, { id: CLIENT_ID }])("reports the id %j as not found", async (clientId) => {
    expect(await updateClient(clientId, input)).toMatchObject({
      success: false,
      error: { code: "NOT_FOUND", message: "That client could not be found." },
    });
    expect(await archiveClient(clientId)).toMatchObject({ success: false, error: { code: "NOT_FOUND" } });
    expect(mocks.updateClient).not.toHaveBeenCalled();
    expect(mocks.archiveClient).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    const result = await createClient({ name: "", email: "nope" });
    expect(result).toMatchObject({ success: false, error: { code: "VALIDATION" } });
    expect(result.error?.fieldErrors).toEqual({
      name: ["Enter the contact's name."],
      email: ["Enter a valid email address."],
      defaultCurrency: ["Choose a currency."],
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("maps known service errors without revalidating", async () => {
    mocks.updateClient.mockRejectedValue(new NotFoundError());
    expect(await updateClient(CLIENT_ID, input)).toMatchObject({ error: { code: "NOT_FOUND" } });

    mocks.updateClient.mockRejectedValue(new ConflictError());
    expect(await updateClient(CLIENT_ID, input)).toMatchObject({
      error: { code: "CONFLICT", message: "This client is archived and can no longer be changed." },
    });

    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(errorLog).not.toHaveBeenCalled();
  });

  it("logs only a code for unexpected failures", async () => {
    const prismaError = Object.assign(new Error(`duplicate ${input.email} ${CLIENT_ID}`), { code: "P2002" });
    mocks.createClient.mockRejectedValue(prismaError);
    expect(await createClient(input)).toMatchObject({
      success: false,
      error: { code: "UNEXPECTED", message: "Something went wrong. Please try again in a moment." },
    });

    mocks.archiveClient.mockRejectedValue(new TypeError(`boom ${input.notes}`));
    expect(await archiveClient(CLIENT_ID)).toMatchObject({ error: { code: "UNEXPECTED" } });

    expect(errorLog.mock.calls).toEqual([
      ["[clients] createClient failed: P2002"],
      ["[clients] archiveClient failed: TypeError"],
    ]);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
