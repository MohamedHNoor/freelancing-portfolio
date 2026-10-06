import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuth: vi.fn(),
  GET: vi.fn(async () => new Response("get")),
  POST: vi.fn(async () => new Response("post")),
}));

vi.mock("@/lib/auth/server", () => ({ getAuth: mocks.getAuth }));

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

  it("delegates GET and POST to the SDK handler, resolving it once", async () => {
    const route = await import("@/app/api/auth/[...path]/route");
    const context = { params: Promise.resolve({ path: ["get-session"] }) };
    const request = new Request("http://localhost/api/auth/get-session");
    expect(await (await route.GET(request, context)).text()).toBe("get");
    expect(await (await route.POST(request, context)).text()).toBe("post");
    expect(mocks.GET).toHaveBeenCalledWith(request, context);
    expect(mocks.POST).toHaveBeenCalledWith(request, context);
    expect(mocks.getAuth).toHaveBeenCalledTimes(1);
  });
});
