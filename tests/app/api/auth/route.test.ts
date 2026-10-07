import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuth: vi.fn(),
  GET: vi.fn(async () => new Response("get")),
  POST: vi.fn(async () => new Response("post")),
}));

vi.mock("@/lib/auth/server", () => ({ getAuth: mocks.getAuth }));

const context = (...path: string[]) => ({ params: Promise.resolve({ path }) });

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.getAuth.mockReturnValue({ handler: () => ({ GET: mocks.GET, POST: mocks.POST }) });
});

describe("/api/auth/[...path]", () => {
  it("touches no auth instance on import", async () => {
    await import("@/app/api/auth/[...path]/route");
    expect(mocks.getAuth).not.toHaveBeenCalled();
  });

  it("delegates the allowed session read and sign-out, resolving the SDK once", async () => {
    const route = await import("@/app/api/auth/[...path]/route");
    const request = new Request("http://localhost/api/auth/get-session");
    const read = context("get-session");
    const out = context("sign-out");
    expect(await (await route.GET(request, read)).text()).toBe("get");
    expect(await (await route.POST(request, out)).text()).toBe("post");
    expect(mocks.GET).toHaveBeenCalledWith(request, read);
    expect(mocks.POST).toHaveBeenCalledWith(request, out);
    expect(mocks.getAuth).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["GET", ["sign-out"]],
    ["POST", ["get-session"]],
    ["POST", ["sign-up", "email"]],
    ["POST", ["sign-in", "email"]],
    ["POST", ["request-password-reset"]],
    ["POST", ["send-verification-email"]],
    ["POST", ["update-user"]],
    ["GET", ["admin", "list-users"]],
    ["GET", ["get-session", "extra"]],
  ] as const)("refuses %s %j with 404 without reaching Neon", async (method, path) => {
    const route = await import("@/app/api/auth/[...path]/route");
    const response = await route[method](new Request("http://localhost/api/auth/x", { method }), context(...path));
    expect(response.status).toBe(404);
    expect(mocks.getAuth).not.toHaveBeenCalled();
  });
});
