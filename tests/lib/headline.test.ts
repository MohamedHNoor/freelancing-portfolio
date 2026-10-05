import { describe, expect, it } from "vitest";
import { emphasise, headlineLines } from "@/lib/headline";
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

describe("emphasise", () => {
  it("splits a phrase out of the middle of a line", () => {
    expect(emphasise("Built for Your Business today", "Your Business")).toEqual([
      { text: "Built for ", emphasis: false },
      { text: "Your Business", emphasis: true },
      { text: " today", emphasis: false },
    ]);
  });

  it("leaves no empty segment when the phrase ends the line", () => {
    expect(emphasise("Built for Your Business", "Your Business")).toEqual([
      { text: "Built for ", emphasis: false },
      { text: "Your Business", emphasis: true },
    ]);
  });

  it("leaves no empty segment when the phrase starts the line", () => {
    expect(emphasise("Your Business, built", "Your Business")).toEqual([
      { text: "Your Business", emphasis: true },
      { text: ", built", emphasis: false },
    ]);
  });

  it("emphasises a phrase that is the whole line", () => {
    expect(emphasise("Your Business", "Your Business")).toEqual([
      { text: "Your Business", emphasis: true },
    ]);
  });

  it("emphasises only the first occurrence", () => {
    expect(emphasise("web and web", "web")).toEqual([
      { text: "web", emphasis: true },
      { text: " and web", emphasis: false },
    ]);
  });

  it("is case-sensitive, matching the content invariant", () => {
    expect(emphasise("Built for your business", "Your Business")).toEqual([
      { text: "Built for your business", emphasis: false },
    ]);
  });

  it("returns the line unchanged for an empty phrase", () => {
    expect(emphasise("Built for You", "")).toEqual([
      { text: "Built for You", emphasis: false },
    ]);
  });

  it("emphasises the real headline's phrase exactly once", () => {
    const { headline, headlineEmphasis } = getProfile();
    const emphasised = headlineLines(headline)
      .flatMap((line) => emphasise(line, headlineEmphasis))
      .filter((segment) => segment.emphasis);
    expect(emphasised).toEqual([{ text: headlineEmphasis, emphasis: true }]);
  });
});
