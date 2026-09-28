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

  /* The hero is designed for exactly two lines. A third sentence would add a
     line the layout was not measured for. */
  it("gives the real headline two lines", () => {
    expect(headlineLines(getProfile().headline)).toHaveLength(2);
  });
});
