import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireOwner: vi.fn() }));

vi.mock("@/server/auth/session", () => ({ requireOwner: mocks.requireOwner }));
vi.mock("@/content", () => ({ getProfile: () => ({ name: "Public business name" }) }));
vi.mock("@/components/dashboard/shell/AppSidebar", () => ({ AppSidebar: () => null }));
vi.mock("@/components/dashboard/shell/Topbar", () => ({ Topbar: () => null }));

import DashboardLayout from "@/app/dashboard/layout";
import DashboardPage from "@/app/dashboard/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireOwner.mockResolvedValue({ userId: "private-owner-id" });
});

describe("dashboard authorization boundaries", () => {
  it("guards both the layout and the page, without rendering the private owner id", async () => {
    const page = await DashboardPage();
    const layout = await DashboardLayout({ children: page });
    const markup = renderToStaticMarkup(layout);

    expect(mocks.requireOwner).toHaveBeenCalledTimes(2);
    expect(markup).toContain("Your private workspace");
    expect(markup).not.toContain("private-owner-id");
  });

  it("propagates the existing unauthorized login redirect from either boundary", async () => {
    const redirect = new Error("NEXT_REDIRECT /login");
    mocks.requireOwner.mockRejectedValue(redirect);

    await expect(DashboardPage()).rejects.toBe(redirect);
    await expect(DashboardLayout({ children: "Protected child" })).rejects.toBe(redirect);
  });

  it("propagates auth-service failures to the unexpected-error boundaries", async () => {
    const failure = new Error("Unexpected provider failure with private detail");
    mocks.requireOwner.mockRejectedValue(failure);

    await expect(DashboardPage()).rejects.toBe(failure);
    await expect(DashboardLayout({ children: "Protected child" })).rejects.toBe(failure);
  });
});
