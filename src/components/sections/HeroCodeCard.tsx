import { TypedCode, type CodeToken } from "@/components/sections/TypedCode";
import { getProfile, getTechnologyMarks } from "@/content";

function entry(indent: string, value: string): CodeToken[] {
  return [
    { text: indent },
    { text: `"${value}"`, tone: "value" },
    { text: ",", tone: "punct" },
  ];
}

/* Decorative. Every value here already appears in the hero text, the
   availability pill, the technology row, or the about section, so it is hidden
   from assistive technology rather than repeated as noise. Keys are
   presentational labels; values come from the content layer. */
export function HeroCodeCard() {
  const profile = getProfile();
  const stack = getTechnologyMarks(4);

  const lines: CodeToken[][] = [
    [
      { text: "const ", tone: "punct" },
      { text: "developer", tone: "accent" },
      { text: " = {", tone: "punct" },
    ],
    [
      { text: "  name: " },
      { text: `"${profile.name}"`, tone: "value" },
      { text: ",", tone: "punct" },
    ],
    [{ text: "  tracks: [" }],
    ...profile.specialisms.map((slug) => entry("    ", slug)),
    [{ text: "  ]," }],
    [{ text: "  stack: [" }],
    ...stack.map((skill) => entry("    ", skill.name)),
    [{ text: "  ]," }],
    [
      { text: "  based: " },
      { text: `"${profile.location}"`, tone: "value" },
      { text: ",", tone: "punct" },
    ],
    [
      { text: "  available: " },
      {
        text: String(profile.availability.status === "available"),
        tone: "accent",
      },
      { text: ",", tone: "punct" },
    ],
    [{ text: "};", tone: "punct" }],
  ];

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-xl border border-border bg-card/90 shadow-2xl shadow-black/20 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          profile.ts
        </span>
        <span className="ml-auto size-2 rounded-full bg-brand" />
      </div>
      <TypedCode lines={lines} />
    </div>
  );
}
