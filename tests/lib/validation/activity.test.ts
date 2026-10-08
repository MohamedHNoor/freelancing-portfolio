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
