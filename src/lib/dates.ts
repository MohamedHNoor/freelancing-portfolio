/* Role dates are `YYYY-MM` strings, never `Date`, so nothing here can drift by a
   timezone. Formatting uses a literal month table rather than `Intl`, because
   `Intl` resolves its locale from the environment: the build server and the
   browser can disagree, which is both a hydration mismatch and a test that
   passes only on the machine that wrote it.

   `content/index.ts` holds an equivalent private `YEAR_MONTH_PATTERN`. That is a
   real duplication and nothing guards the two against drifting; consolidating it
   means editing the content module and is not worth doing from here. */

const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** The sentinel `Role.end` carries while a role is ongoing. Exported so callers
 *  can tell an open-ended role from a dated one without a magic string: only a
 *  dated end is a valid `<time datetime>` value. */
export const PRESENT = "present";

/** `"2024-06"` becomes `"Jun 2024"`. Throws on anything else, including
 *  `PRESENT`, which is not a year-month. Content invariants already reject a
 *  malformed date at import, so this throw is a developer guard rather than a
 *  runtime path. */
export function formatYearMonth(value: string): string {
  const match = YEAR_MONTH.exec(value);
  if (!match) {
    throw new RangeError(
      `Expected a YYYY-MM date, received ${JSON.stringify(value)}`,
    );
  }

  const [, year, month] = match;
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** The end of a role's date range: `"Present"` for an ongoing role, otherwise
 *  the formatted year and month. */
export function formatRoleEnd(end: string): string {
  return end === PRESENT ? "Present" : formatYearMonth(end);
}
