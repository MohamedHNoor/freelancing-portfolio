"use client";

import { useEffect, useState } from "react";

export type CodeToken = {
  text: string;
  tone?: "punct" | "value" | "accent";
};

/* Roughly 40 characters a second, which reads as deliberate typing rather than
   a paint-on. The whole block lands in about five seconds. */
const CHARS_PER_TICK = 1;
const TICK_MS = 25;

const TONE: Record<NonNullable<CodeToken["tone"]>, string> = {
  punct: "text-muted-foreground",
  value: "text-foreground",
  accent: "text-brand",
};

/** Types the card's contents out on mount.
 *
 *  Untyped characters are rendered with `invisible` rather than omitted, so the
 *  block occupies its full size from the first paint and nothing shifts as the
 *  text appears.
 *
 *  The reduced-motion check lives in the effect, not in the render, because
 *  branching the markup on a media query makes the server and client renders
 *  disagree. Reduced motion reveals everything on the first tick instead. */
export function TypedCode({ lines }: { lines: readonly (readonly CodeToken[])[] }) {
  const total = lines.reduce(
    (sum, line) => sum + line.reduce((n, token) => n + token.text.length, 0),
    0,
  );
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = reduced ? total : CHARS_PER_TICK;
    let count = 0;
    const id = window.setInterval(
      () => {
        count = Math.min(count + step, total);
        setTyped(count);
        if (count >= total) {
          window.clearInterval(id);
        }
      },
      reduced ? 0 : TICK_MS,
    );
    return () => window.clearInterval(id);
  }, [total]);

  const rows: { token: CodeToken; start: number }[][] = [];
  let offset = 0;
  for (const line of lines) {
    const row: { token: CodeToken; start: number }[] = [];
    for (const token of line) {
      row.push({ token, start: offset });
      offset += token.text.length;
    }
    rows.push(row);
  }

  return (
    <pre className="overflow-x-auto p-5 font-mono text-[0.78rem] leading-[1.85] sm:text-[0.82rem]">
      <code>
        {rows.map((row, lineIndex) => (
          <span key={lineIndex}>
            {row.map(({ token, start }, tokenIndex) => {
              const shown = Math.min(
                token.text.length,
                Math.max(0, typed - start),
              );
              const atCursor = typed >= start && typed < start + token.text.length;
              return (
                <span
                  key={tokenIndex}
                  className={token.tone ? TONE[token.tone] : undefined}
                >
                  {token.text.slice(0, shown)}
                  {atCursor ? (
                    <span className="animate-pulse text-brand">|</span>
                  ) : null}
                  {shown < token.text.length ? (
                    <span className="invisible">{token.text.slice(shown)}</span>
                  ) : null}
                </span>
              );
            })}
            {"\n"}
          </span>
        ))}
      </code>
    </pre>
  );
}
