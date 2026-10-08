import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/permissions";

const mocks = vi.hoisted(() => ({ getOwner: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({
  requireOwnerForAction: async () =>
    (await mocks.getOwner()) ?? {
      success: false,
      data: null,
      error: { code: "UNAUTHENTICATED", message: "Please sign in again." },
    },
}));

const { ownerAction } = await import("@/server/owner-action");

const config = { label: ["tests", "run"] as const, schema: z.object({ amount: z.string() }) };
let errorLog: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  mocks.getOwner.mockResolvedValue({ userId: "8f6c2a3e-0b1d-4e5f-9a7b-1c2d3e4f5a6b" });
  errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorLog.mockRestore();
});

describe("ownerAction error mapping", () => {
  it("returns a server-side ValidationError as VALIDATION with its field errors, unlogged", async () => {
    const result = await ownerAction(config, { amount: "1.234" }, async () => {
      throw new ValidationError({ amount: ["Enter an amount such as 1,500.00."] });
    });
    expect(result).toEqual({
      success: false,
      data: null,
      error: {
        code: "VALIDATION",
        message: "Some of those details need another look.",
        fieldErrors: { amount: ["Enter an amount such as 1,500.00."] },
      },
    });
    expect(errorLog).not.toHaveBeenCalled();
  });

  it("still maps NotFound and Conflict, and logs only unknown errors by code", async () => {
    const run = (error: Error) => ownerAction(config, { amount: "1" }, async () => Promise.reject(error));
    expect((await run(new NotFoundError())).error?.code).toBe("NOT_FOUND");
    expect((await run(new ConflictError())).error?.code).toBe("CONFLICT");
    expect(errorLog).not.toHaveBeenCalled();

    const unexpected = await run(new TypeError("private detail"));
    expect(unexpected.error?.code).toBe("UNEXPECTED");
    expect(errorLog).toHaveBeenCalledWith("[tests] run failed: TypeError");
  });
});
