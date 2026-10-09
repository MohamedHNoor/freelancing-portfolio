import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/permissions";

const mocks = vi.hoisted(() => ({
  getOwner: vi.fn(),
  createMilestone: vi.fn(),
  updateMilestone: vi.fn(),
  reorderMilestones: vi.fn(),
  deleteMilestone: vi.fn(),
  cancelMilestone: vi.fn(),
  restoreMilestone: vi.fn(),
  applyPlanPreset: vi.fn(),
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
vi.mock("@/server/services/payment-plan", () => ({
  createMilestone: mocks.createMilestone,
  updateMilestone: mocks.updateMilestone,
  reorderMilestones: mocks.reorderMilestones,
  deleteMilestone: mocks.deleteMilestone,
  cancelMilestone: mocks.cancelMilestone,
  restoreMilestone: mocks.restoreMilestone,
  applyPlanPreset: mocks.applyPlanPreset,
}));

const actions = await import("@/actions/milestones");

const OWNER_ID = "8f6c2a3e-0b1d-4e5f-9a7b-1c2d3e4f5a6b";
const CLIENT_ID = "3f2c1b8e-9a4d-4c6e-8f1a-2b3c4d5e6f70";
const PROJECT_ID = "5a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
const MILESTONE_ID = "7c8d9e0f-1a2b-4c3d-8e4f-5a6b7c8d9e0f";
const OTHER_ID = "7c8d9e0f-1a2b-4c3d-8e4f-5a6b7c8d9e10";
const fixed = { name: "Build", billingTrigger: "on_completion", pricingMode: "fixed", amount: "1,500.00" };
const milestoneResult = { projectId: PROJECT_ID, clientId: CLIENT_ID, milestoneId: MILESTONE_ID };
const planResult = { projectId: PROJECT_ID, clientId: CLIENT_ID };
const revalidated = [["/dashboard/projects"], [`/dashboard/projects/${PROJECT_ID}`, "layout"], [`/dashboard/clients/${CLIENT_ID}`]];
let errorLog: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOwner.mockResolvedValue({ userId: OWNER_ID });
  for (const m of [mocks.createMilestone, mocks.updateMilestone, mocks.deleteMilestone, mocks.cancelMilestone, mocks.restoreMilestone]) {
    m.mockResolvedValue(milestoneResult);
  }
  mocks.reorderMilestones.mockResolvedValue(planResult);
  mocks.applyPlanPreset.mockResolvedValue(planResult);
  errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorLog.mockRestore();
});

describe("milestone actions", () => {
  it("creates a milestone under the bound project and revalidates its pages", async () => {
    await expect(actions.createMilestone(PROJECT_ID, fixed)).resolves.toEqual({
      success: true,
      data: { projectId: PROJECT_ID, milestoneId: MILESTONE_ID },
      error: null,
    });
    expect(mocks.createMilestone).toHaveBeenCalledWith(OWNER_ID, PROJECT_ID, {
      name: "Build",
      description: null,
      billingTrigger: "on_completion",
      dueDate: null,
      pricingMode: "fixed",
      amount: "1,500.00",
    });
    expect(mocks.revalidatePath.mock.calls).toEqual(revalidated);
  });

  it("passes parsed input to every plan service", async () => {
    await actions.updateMilestone(MILESTONE_ID, { ...fixed, pricingMode: "percentage", percent: "12.5" });
    expect(mocks.updateMilestone).toHaveBeenCalledWith(OWNER_ID, MILESTONE_ID, expect.objectContaining({ percent: 1250 }));

    await expect(actions.reorderMilestones(PROJECT_ID, { ids: [OTHER_ID, MILESTONE_ID] })).resolves.toMatchObject({
      success: true,
      data: { projectId: PROJECT_ID },
    });
    expect(mocks.reorderMilestones).toHaveBeenCalledWith(OWNER_ID, PROJECT_ID, [OTHER_ID, MILESTONE_ID]);

    await actions.applyPlanPreset(PROJECT_ID, { kind: "fixed", count: "2" });
    expect(mocks.applyPlanPreset).toHaveBeenCalledWith(OWNER_ID, PROJECT_ID, { kind: "fixed", count: 2 });

    for (const [action, service] of [
      [actions.deleteMilestone, mocks.deleteMilestone],
      [actions.cancelMilestone, mocks.cancelMilestone],
      [actions.restoreMilestone, mocks.restoreMilestone],
    ] as const) {
      await expect(action(MILESTONE_ID)).resolves.toMatchObject({ success: true, data: { milestoneId: MILESTONE_ID } });
      expect(service).toHaveBeenCalledWith(OWNER_ID, MILESTONE_ID);
    }
  });

  it("checks the owner first", async () => {
    mocks.getOwner.mockResolvedValue(null);
    expect(await actions.createMilestone(PROJECT_ID, fixed)).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
    expect(await actions.cancelMilestone("bad")).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
    expect(mocks.createMilestone).not.toHaveBeenCalled();
  });

  it("reports a malformed id as not found before validating input", async () => {
    expect(await actions.createMilestone("nope", {})).toMatchObject({
      error: { code: "NOT_FOUND", message: "That project could not be found." },
    });
    expect(await actions.updateMilestone(42, {})).toMatchObject({
      error: { code: "NOT_FOUND", message: "That milestone could not be found." },
    });
    expect(await actions.restoreMilestone(undefined)).toMatchObject({ error: { code: "NOT_FOUND" } });
    expect(mocks.updateMilestone).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    const r = await actions.createMilestone(PROJECT_ID, { ...fixed, pricingMode: "percentage", percent: "150" });
    expect(r.error).toMatchObject({ code: "VALIDATION", fieldErrors: { percent: ["Enter a percentage above 0 and at most 100."] } });
    const reorder = await actions.reorderMilestones(PROJECT_ID, { ids: [MILESTONE_ID, MILESTONE_ID] });
    expect(reorder.error?.code).toBe("VALIDATION");
    expect(mocks.createMilestone).not.toHaveBeenCalled();
    expect(mocks.reorderMilestones).not.toHaveBeenCalled();
  });

  it("maps service errors without revalidating", async () => {
    mocks.createMilestone.mockRejectedValueOnce(new ValidationError({ amount: ["This would allocate more than the project total."] }));
    expect(await actions.createMilestone(PROJECT_ID, fixed)).toMatchObject({
      error: { code: "VALIDATION", fieldErrors: { amount: ["This would allocate more than the project total."] } },
    });
    mocks.cancelMilestone.mockRejectedValueOnce(new ConflictError());
    expect(await actions.cancelMilestone(MILESTONE_ID)).toMatchObject({
      error: { code: "CONFLICT", message: "That change is no longer possible for this project." },
    });
    mocks.deleteMilestone.mockRejectedValueOnce(new NotFoundError());
    expect(await actions.deleteMilestone(MILESTONE_ID)).toMatchObject({ error: { code: "NOT_FOUND" } });
    mocks.restoreMilestone.mockRejectedValueOnce(new TypeError("private"));
    expect(await actions.restoreMilestone(MILESTONE_ID)).toMatchObject({ error: { code: "UNEXPECTED" } });

    expect(errorLog.mock.calls).toEqual([["[milestones] restoreMilestone failed: TypeError"]]);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
