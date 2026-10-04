import { describe, expect, it } from "vitest";
import { headlineLines } from "@/lib/headline";
import { getProfile } from "@/content";

describe("headlineLines", () => {
  it("puts each sentence on its own line", () => {
    expect(headlineLines("Design files to production. SaaS to launch.")).toEqual(
      ["Design files to production.", "SaaS to launch."],
    );
  });

  it("keeps a single sentence whole", () => {
    expect(headlineLines("Design files to production.")).toEqual([
      "Design files to production.",
    ]);
  });

  it("does not split on a full stop inside a word", () => {
    expect(headlineLines("Figma to Next.js. SaaS to launch.")).toEqual([
      "Figma to Next.js.",
      "SaaS to launch.",
    ]);
  });

  it("ends a sentence at a question or exclamation mark too", () => {
    expect(headlineLines("Need a site? Built fast!")).toEqual([
      "Need a site?",
      "Built fast!",
    ]);
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(headlineLines("  One.   Two.  ")).toEqual(["One.", "Two."]);
  });

  it("returns nothing for an empty headline", () => {
    expect(headlineLines("   ")).toEqual([]);
  });

  /* The headline is one sentence, so it renders as one block that wraps under
     `text-balance` rather than breaking at a full stop. A second sentence would
     add a forced break the layout was not designed for. */
  it("gives the real headline one line per sentence: one", () => {
    expect(headlineLines(getProfile().headline)).toHaveLength(1);
  });
});
