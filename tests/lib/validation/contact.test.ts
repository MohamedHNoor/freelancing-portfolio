import { describe, expect, it } from "vitest";
import {
  BUDGET_RANGES,
  EXISTING_DESIGN_OPTIONS,
  PROJECT_TYPES,
  TIMELINES,
  contactSchema,
  projectTypeFromQuery,
} from "@/lib/validation/contact";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines Ltd",
  projectType: "figma-to-nextjs" as const,
  message: "I have a finished Figma file for six pages and no front-end capacity.",
  existingDesign: "figma" as const,
  budgetRange: "5k-15k" as const,
  timeline: "within-1-month" as const,
  website: "",
};

const parse = (patch: Record<string, unknown> = {}) =>
  contactSchema.safeParse({ ...valid, ...patch });

/** Every message a visitor could see, for the "no Zod defaults" assertion. */
const messagesFor = (patch: Record<string, unknown>) => {
  const r = parse(patch);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe("contactSchema, valid input", () => {
  it("accepts a well-formed submission", () => {
    expect(parse().success).toBe(true);
  });

  it("trims whitespace and lowercases the address", () => {
    const r = parse({ name: "  Ada  ", email: "  ADA@Example.COM  " });
    expect(r.success && r.data.name).toBe("Ada");
    expect(r.success && r.data.email).toBe("ada@example.com");
  });

  it.each([
    ["an absent company", { company: undefined }],
    ["an empty company", { company: "" }],
    ["an absent budget", { budgetRange: undefined }],
    ["an empty budget, the form's 'prefer not to say'", { budgetRange: "" }],
  ])("accepts %s", (_label, patch) => {
    expect(parse(patch).success).toBe(true);
  });

  it("accepts every declared project type, design answer, budget and timeline", () => {
    for (const projectType of PROJECT_TYPES) {
      expect(parse({ projectType }).success).toBe(true);
    }
    for (const existingDesign of EXISTING_DESIGN_OPTIONS) {
      expect(parse({ existingDesign }).success).toBe(true);
    }
    for (const budgetRange of BUDGET_RANGES) {
      expect(parse({ budgetRange }).success).toBe(true);
    }
    for (const timeline of TIMELINES) {
      expect(parse({ timeline }).success).toBe(true);
    }
  });
});

describe("contactSchema, boundaries", () => {
  it.each([
    ["name too short", { name: "A" }],
    ["name too long", { name: "A".repeat(101) }],
    ["company too long", { company: "A".repeat(121) }],
    ["message too short", { message: "A".repeat(19) }],
    ["message too long", { message: "A".repeat(5001) }],
    ["email malformed", { email: "not-an-address" }],
    ["unknown project type", { projectType: "consulting" }],
    ["no project type chosen", { projectType: "" }],
    ["no design answer chosen", { existingDesign: "" }],
    ["unknown budget", { budgetRange: "a million dollars" }],
    ["no timeline chosen", { timeline: "" }],
    ["free-text timeline", { timeline: "Next month" }],
  ])("rejects %s", (_label, patch) => {
    expect(parse(patch).success).toBe(false);
  });

  it.each([
    ["name at the lower bound", { name: "Ad" }],
    ["name at the upper bound", { name: "A".repeat(100) }],
    ["company at the upper bound", { company: "A".repeat(120) }],
    ["message at the lower bound", { message: "A".repeat(20) }],
    ["message at the upper bound", { message: "A".repeat(5000) }],
  ])("accepts %s", (_label, patch) => {
    expect(parse(patch).success).toBe(true);
  });
});

describe("contactSchema, the honeypot", () => {
  it("rejects a filled honeypot", () => {
    expect(parse({ website: "https://spam.example" }).success).toBe(false);
  });

  it("accepts an empty honeypot", () => {
    expect(parse({ website: "" }).success).toBe(true);
  });

  /* `company` was the honeypot until it became a real field. A visitor who
     fills it in is a person, not a bot. */
  it("treats a filled company as an answer, not a bot", () => {
    expect(parse({ company: "Acme Corp" }).success).toBe(true);
  });
});

describe("contactSchema, header safety", () => {
  /* `name` is the only submitted value that reaches the subject line. */
  it("replaces carriage returns and newlines in the name", () => {
    const r = parse({ name: "Ada\r\nBcc: someone@example.com" });
    expect(r.success && r.data.name).toBe("Ada Bcc: someone@example.com");
    expect(r.success && r.data.name).not.toMatch(/[\r\n]/);
  });

  it("collapses a run of newlines into one space", () => {
    const r = parse({ name: "Ada\n\n\nLovelace" });
    expect(r.success && r.data.name).toBe("Ada Lovelace");
  });
});

describe("contactSchema, error messages", () => {
  /* A visitor reads these. Zod's defaults ("String must contain at least 2
     character(s)") are not acceptable copy. */
  it("writes every message for a human", () => {
    const all = [
      ...messagesFor({ name: "A" }),
      ...messagesFor({ email: "nope" }),
      ...messagesFor({ company: "A".repeat(121) }),
      ...messagesFor({ message: "short" }),
      ...messagesFor({ timeline: "" }),
      ...messagesFor({ projectType: "nope" }),
      ...messagesFor({ existingDesign: "" }),
    ];
    expect(all.length).toBeGreaterThan(0);
    for (const message of all) {
      expect(message).not.toMatch(/String must contain|Invalid enum|Expected/);
      expect(message.endsWith(".") || message.endsWith("?")).toBe(true);
    }
  });
});

describe("projectTypeFromQuery", () => {
  it("returns a declared project type", () => {
    expect(projectTypeFromQuery("?type=saas-product")).toBe("saas-product");
  });

  it("ignores the rest of the query", () => {
    expect(projectTypeFromQuery("?utm_source=github&type=ecommerce")).toBe(
      "ecommerce",
    );
  });

  it.each([
    ["no query", ""],
    ["no type", "?ref=linkedin"],
    ["an unknown type", "?type=consulting"],
    ["an injected value", "?type=%3Cscript%3E"],
  ])("returns nothing for %s", (_label, search) => {
    expect(projectTypeFromQuery(search)).toBeUndefined();
  });
});
