import { describe, expect, it } from "vitest";
import { isNavItemCurrent, workspaceSectionLabel } from "@/lib/dashboard/navigation";

describe("isNavItemCurrent", () => {
  it("marks Overview only on its own page", () => {
    expect(isNavItemCurrent("/dashboard", "/dashboard")).toBe(true);
    expect(isNavItemCurrent("/dashboard/clients", "/dashboard")).toBe(false);
  });

  it("marks Clients on its page and every nested route only", () => {
    expect(isNavItemCurrent("/dashboard/clients", "/dashboard/clients")).toBe(true);
    expect(isNavItemCurrent("/dashboard/clients/new", "/dashboard/clients")).toBe(true);
    expect(isNavItemCurrent("/dashboard/clients/3f2c/edit", "/dashboard/clients")).toBe(true);
    expect(isNavItemCurrent("/dashboard/clientsx", "/dashboard/clients")).toBe(false);
    expect(isNavItemCurrent("/dashboard", "/dashboard/clients")).toBe(false);
  });

  it("marks Projects on its page and every nested route only", () => {
    expect(isNavItemCurrent("/dashboard/projects", "/dashboard/projects")).toBe(true);
    expect(isNavItemCurrent("/dashboard/projects/x", "/dashboard/projects")).toBe(true);
    expect(isNavItemCurrent("/dashboard/projects/x/plan", "/dashboard/projects")).toBe(true);
    expect(isNavItemCurrent("/dashboard/projectsx", "/dashboard/projects")).toBe(false);
  });
});

describe("workspaceSectionLabel", () => {
  it.each([
    ["/dashboard", "Overview"],
    ["/dashboard/clients", "Clients"],
    ["/dashboard/clients/new", "Clients"],
    ["/dashboard/projects", "Projects"],
    ["/dashboard/projects/x/settings", "Projects"],
    ["/dashboard/unknown", "Overview"],
  ])("labels %s as %s", (pathname, label) => {
    expect(workspaceSectionLabel(pathname)).toBe(label);
  });
});
