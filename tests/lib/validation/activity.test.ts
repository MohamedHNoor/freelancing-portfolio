import { describe, expect, it } from "vitest";
import { activityDataSchema } from "@/lib/validation/activity";

describe("activityDataSchema", () => {
  it("accepts each client payload", () => {
    expect(activityDataSchema.safeParse({ type: "client_created", data: {} }).success).toBe(true);
    expect(activityDataSchema.safeParse({ type: "client_archived", data: {} }).success).toBe(true);
    expect(
      activityDataSchema.safeParse({ type: "client_updated", data: { changedFields: ["email", "notes"] } }).success,
    ).toBe(true);
  });

  it("rejects an empty change list, an unknown field and values smuggled into data", () => {
    expect(activityDataSchema.safeParse({ type: "client_updated", data: { changedFields: [] } }).success).toBe(false);
    expect(activityDataSchema.safeParse({ type: "client_updated", data: { changedFields: ["ownerId"] } }).success).toBe(
      false,
    );
    expect(activityDataSchema.safeParse({ type: "client_created", data: { email: "a@b.io" } }).success).toBe(false);
  });

  it("rejects an unknown type", () => {
    expect(activityDataSchema.safeParse({ type: "client_deleted", data: {} }).success).toBe(false);
  });
});

describe("activityDataSchema, projects and milestones", () => {
  it.each([
    { type: "project_created", data: {} },
    { type: "project_updated", data: { changedFields: ["name", "totalAmountMinor"] } },
    { type: "project_status_changed", data: { from: "draft", to: "active" } },
    { type: "payment_plan_changed", data: { change: "preset_applied" } },
    { type: "payment_plan_changed", data: { change: "reordered" } },
    { type: "payment_plan_changed", data: { change: "milestone_deleted" } },
    { type: "payment_plan_changed", data: { change: "milestone_restored" } },
    { type: "milestone_created", data: {} },
    { type: "milestone_updated", data: { changedFields: ["amountMinor", "dueDate"] } },
    { type: "milestone_cancelled", data: {} },
  ])("accepts %j", (payload) => {
    expect(activityDataSchema.safeParse(payload).success).toBe(true);
  });

  it.each([
    { type: "project_updated", data: { changedFields: [] } },
    { type: "project_updated", data: { changedFields: ["clientId"] } },
    { type: "project_status_changed", data: { from: "draft", to: "archived" } },
    { type: "project_status_changed", data: { from: "draft", to: "active", total: 5 } },
    { type: "payment_plan_changed", data: { change: "renamed" } },
    { type: "milestone_updated", data: { changedFields: ["status"] } },
    { type: "milestone_created", data: { amountMinor: 100 } },
    { type: "milestone_started", data: {} },
  ])("rejects %j", (payload) => {
    expect(activityDataSchema.safeParse(payload).success).toBe(false);
  });
});
