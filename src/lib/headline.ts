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
