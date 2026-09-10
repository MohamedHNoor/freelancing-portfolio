import { describe, expect, it } from "vitest";
import type { Project } from "@/types/content";
import {
  assertDeployable,
  findDeployBlockers,
  isProductionDeploy,
} from "@/lib/deploy-readiness";

function project(slug: string, isPlaceholder: boolean): Project {
  return { slug, title: slug, isPlaceholder } as unknown as Project;
}

const REAL = project("records-platform", false);
const SEEDED = project("example-health-platform", true);
const SEEDED_TOO = project("example-finance-dashboard", true);

describe("isProductionDeploy", () => {
  it("is true only for the exact production string", () => {
    expect(isProductionDeploy({ VERCEL_ENV: "production" })).toBe(true);
  });

  /* Previews are the normal way to review this site while its projects are
     still seeded, so they must not be gated. */
  const notProduction: readonly (readonly [string | undefined, string])[] = [
    ["preview", "a Vercel preview deploy"],
    ["development", "a Vercel development env"],
    ["", "an empty value"],
    ["Production", "the wrong case"],
    [undefined, "nothing set, such as a local build"],
  ];

  it.each(notProduction)("is false for %o (%s)", (value) => {
    expect(isProductionDeploy({ VERCEL_ENV: value })).toBe(false);
  });
});

describe("findDeployBlockers", () => {
  it("finds nothing when every project is real", () => {
    expect(findDeployBlockers({ projects: [REAL] })).toEqual([]);
  });

  it("finds nothing when there are no projects at all", () => {
    expect(findDeployBlockers({ projects: [] })).toEqual([]);
  });

  it("blocks on a single seeded project and names it", () => {
    const blockers = findDeployBlockers({ projects: [REAL, SEEDED] });
    expect(blockers).toHaveLength(1);
    expect(blockers[0].id).toBe("placeholder-projects");
    expect(blockers[0].message).toContain("example-health-platform");
    expect(blockers[0].message).not.toContain("records-platform");
    expect(blockers[0].message).toContain("1 project still marked");
  });

  it("names every seeded project when there are several", () => {
    const blockers = findDeployBlockers({ projects: [SEEDED, REAL, SEEDED_TOO] });
    expect(blockers).toHaveLength(1);
    expect(blockers[0].message).toContain("2 projects still marked");
    expect(blockers[0].message).toContain("example-health-platform");
    expect(blockers[0].message).toContain("example-finance-dashboard");
  });

  /* The real content today. This is the state the gate exists for, and it is
     expected to stay true until real projects replace the seeded three. */
  it("blocks the content this repository currently ships", async () => {
    const { getProjects } = await import("@/content");
    expect(findDeployBlockers({ projects: getProjects() })).toHaveLength(1);
  });
});

describe("assertDeployable", () => {
  it("throws for a production deploy carrying seeded projects", () => {
    expect(() =>
      assertDeployable({
        projects: [SEEDED],
        env: { VERCEL_ENV: "production" },
      }),
    ).toThrow(/Deploy blocked/);
  });

  it("names the blocker id and the slug in the message", () => {
    expect(() =>
      assertDeployable({ projects: [SEEDED], env: { VERCEL_ENV: "production" } }),
    ).toThrow(/placeholder-projects[\s\S]*example-health-platform/);
  });

  it("stays silent for a preview deploy of the same content", () => {
    expect(() =>
      assertDeployable({ projects: [SEEDED], env: { VERCEL_ENV: "preview" } }),
    ).not.toThrow();
  });

  it("stays silent for a local build", () => {
    expect(() => assertDeployable({ projects: [SEEDED], env: {} })).not.toThrow();
  });

  it("stays silent for a production deploy of real projects", () => {
    expect(() =>
      assertDeployable({ projects: [REAL], env: { VERCEL_ENV: "production" } }),
    ).not.toThrow();
  });
});
