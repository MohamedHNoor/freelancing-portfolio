import { describe, expect, it } from "vitest";
import { nextProjectStatus } from "@/lib/state/project";
import { PROJECT_STATUSES, PROJECT_STATUS_ACTIONS } from "@/lib/validation/project";

const ALLOWED: Record<string, string> = {
  "draft activate": "active",
  "active pause": "on_hold",
  "on_hold resume": "active",
  "active complete": "completed",
  "completed reopen": "active",
  "draft cancel": "cancelled",
  "active cancel": "cancelled",
  "on_hold cancel": "cancelled",
};

const pairs = PROJECT_STATUSES.flatMap((from) => PROJECT_STATUS_ACTIONS.map((action) => [from, action] as const));

describe("nextProjectStatus", () => {
  it.each(pairs.filter(([from, action]) => `${from} ${action}` in ALLOWED))("%s --%s-->", (from, action) => {
    expect(nextProjectStatus(from, action)).toBe(ALLOWED[`${from} ${action}`]);
  });

  it.each(pairs.filter(([from, action]) => !(`${from} ${action}` in ALLOWED)))("forbids %s --%s-->", (from, action) => {
    expect(nextProjectStatus(from, action)).toBeNull();
  });

  it("covers every pair", () => {
    expect(pairs).toHaveLength(30);
    expect(Object.keys(ALLOWED)).toHaveLength(8);
  });
});
