import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/permissions";

/* Services and the session are mocked at their module boundaries. The owner
   pipeline, validation and error mapping are the real code path. */
const mocks = vi.hoisted(() => ({
  getOwner: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  changeProjectStatus: vi.fn(),
  deleteProject: vi.fn(),
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
vi.mock("@/server/services/projects", () => ({
  createProject: mocks.createProject,
  updateProject: mocks.updateProject,
  changeProjectStatus: mocks.changeProjectStatus,
  deleteProject: mocks.deleteProject,
}));

const { changeProjectStatus, createProject, deleteProject, updateProject } = await import("@/actions/projects");

const OWNER_ID = "8f6c2a3e-0b1d-4e5f-9a7b-1c2d3e4f5a6b";
const CLIENT_ID = "3f2c1b8e-9a4d-4c6e-8f1a-2b3c4d5e6f70";
const PROJECT_ID = "5a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
const details = { name: "Acme website", currency: "NZD", total: "50,000.00" };
const input = { ...details, clientId: CLIENT_ID, preset: { kind: "deposit_30", count: "3" } };
const result = { projectId: PROJECT_ID, clientId: CLIENT_ID };
const revalidated = [["/dashboard/projects"], [`/dashboard/projects/${PROJECT_ID}`, "layout"], [`/dashboard/clients/${CLIENT_ID}`]];
let errorLog: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOwner.mockResolvedValue({ userId: OWNER_ID });
  for (const service of [mocks.createProject, mocks.updateProject, mocks.changeProjectStatus, mocks.deleteProject]) {
    service.mockResolvedValue(result);
  }
  errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorLog.mockRestore();
});

describe("project actions", () => {
  it("creates a project from parsed input and revalidates its pages", async () => {
    await expect(createProject(input)).resolves.toEqual({ success: true, data: { projectId: PROJECT_ID }, error: null });
    expect(mocks.createProject).toHaveBeenCalledWith(OWNER_ID, {
      clientId: CLIENT_ID,
      name: "Acme website",
      description: null,
      currency: "NZD",
      totalAmountMinor: 5000000,
      startDate: null,
      expectedEndDate: null,
      preset: { kind: "deposit_30", count: 3 },
    });
    expect(mocks.revalidatePath.mock.calls).toEqual(revalidated);
  });

  it("updates, changes status and deletes the bound project id", async () => {
    await expect(updateProject(PROJECT_ID, details)).resolves.toMatchObject({ success: true, data: { projectId: PROJECT_ID } });
    expect(mocks.updateProject).toHaveBeenCalledWith(OWNER_ID, PROJECT_ID, expect.objectContaining({ totalAmountMinor: 5000000 }));
    expect(mocks.updateProject.mock.calls[0][2]).not.toHaveProperty("clientId");

    await expect(changeProjectStatus(PROJECT_ID, { action: "activate" })).resolves.toMatchObject({ success: true });
    expect(mocks.changeProjectStatus).toHaveBeenCalledWith(OWNER_ID, PROJECT_ID, "activate");

    await expect(deleteProject(PROJECT_ID)).resolves.toMatchObject({ success: true });
    expect(mocks.deleteProject).toHaveBeenCalledWith(OWNER_ID, PROJECT_ID);
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(9);
  });

  it("checks the owner before reading any input", async () => {
    mocks.getOwner.mockResolvedValue(null);
    const results = [
      await createProject({}),
      await updateProject("bad", {}),
      await changeProjectStatus("bad", {}),
      await deleteProject("bad"),
    ];
    for (const r of results) expect(r).toMatchObject({ success: false, error: { code: "UNAUTHENTICATED" } });
    expect(mocks.createProject).not.toHaveBeenCalled();
  });

  it.each([undefined, "not-a-uuid", 42])("reports the id %j as not found before validating input", async (projectId) => {
    for (const r of [await updateProject(projectId, {}), await changeProjectStatus(projectId, {}), await deleteProject(projectId)]) {
      expect(r).toMatchObject({ success: false, error: { code: "NOT_FOUND", message: "That project could not be found." } });
    }
    expect(mocks.updateProject).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    const r = await createProject({ name: "", currency: "NZD", total: "0" });
    expect(r).toMatchObject({ success: false, error: { code: "VALIDATION" } });
    expect(r.error?.fieldErrors).toEqual({ clientId: ["Choose a client."], name: ["Enter the project name."] });

    const status = await changeProjectStatus(PROJECT_ID, { action: "archive" });
    expect(status.error?.fieldErrors).toEqual({ action: ["Choose a status change."] });
    expect(mocks.createProject).not.toHaveBeenCalled();
    expect(mocks.changeProjectStatus).not.toHaveBeenCalled();
  });

  it("maps service errors without revalidating", async () => {
    mocks.updateProject.mockRejectedValueOnce(new NotFoundError());
    expect(await updateProject(PROJECT_ID, details)).toMatchObject({ error: { code: "NOT_FOUND" } });

    mocks.changeProjectStatus.mockRejectedValueOnce(new ConflictError());
    expect(await changeProjectStatus(PROJECT_ID, { action: "activate" })).toMatchObject({
      error: { code: "CONFLICT", message: "That change is no longer possible for this project." },
    });

    mocks.updateProject.mockRejectedValueOnce(new ValidationError({ total: ["The payment plan already allocates more than this total."] }));
    expect(await updateProject(PROJECT_ID, details)).toMatchObject({
      error: { code: "VALIDATION", fieldErrors: { total: ["The payment plan already allocates more than this total."] } },
    });

    mocks.deleteProject.mockRejectedValueOnce(Object.assign(new Error(`secret ${PROJECT_ID}`), { code: "P2003" }));
    expect(await deleteProject(PROJECT_ID)).toMatchObject({ error: { code: "UNEXPECTED" } });
    expect(errorLog.mock.calls).toEqual([["[projects] deleteProject failed: P2003"]]);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
