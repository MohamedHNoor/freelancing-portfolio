/** The headline as display lines, one per sentence.
 *
 *  The hero and the social card both want the break at the full stop, not
 *  wherever the text happens to wrap: left to wrap, a wide tablet column fits
 *  the first word of the second sentence onto the first line. A full stop only
 *  ends a sentence when whitespace follows it, so "Next.js" stays whole. */
export function headlineLines(headline: string): string[] {
  return headline
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter((line) => line !== "");
}

export type HeadlineSegment = {
  text: string;
  emphasis: boolean;
};

/** Splits a display line around its emphasised phrase, so the hero can style
 *  that phrase alone. Only the first occurrence is emphasised. A line without
 *  the phrase, or an empty phrase, comes back as one plain segment, and empty
 *  segments are dropped so a phrase at either end leaves no blank text. */
export function emphasise(line: string, phrase: string): HeadlineSegment[] {
  const at = phrase === "" ? -1 : line.indexOf(phrase);
  if (at === -1) {
    return [{ text: line, emphasis: false }];
  }

  return [
    { text: line.slice(0, at), emphasis: false },
    { text: phrase, emphasis: true },
    { text: line.slice(at + phrase.length), emphasis: false },
  ].filter((segment) => segment.text !== "");
}
