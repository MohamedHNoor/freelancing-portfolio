/* Role dates are `YYYY-MM` strings, never `Date`, so nothing here can drift by a
   timezone. Month names come from a literal table rather than `Intl`, because
   `Intl`'s default locale comes from the environment: the build server and the
   browser can disagree, which is both a hydration mismatch and a test that
   passes only on the machine that wrote it.

   Dashboard timestamps are real instants, so `formatDate` and `formatDateTime`
   do use `Intl`, but only for the numeric calendar parts in an explicit locale
   and the `Pacific/Auckland` timezone. The text around them still comes from
   the table below, so neither the machine's locale nor its ICU version (en-NZ
   writes September as "Sept" in some) changes the output. They run on the
   server only.

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

export const BUSINESS_TIME_ZONE = "Pacific/Auckland";

const calendarParts = new Intl.DateTimeFormat("en-NZ", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

function partsOf(date: Date) {
  if (Number.isNaN(date.getTime())) throw new RangeError("Expected a valid date.");
  const parts: Record<string, number> = {};
  for (const { type, value } of calendarParts.formatToParts(date)) {
    if (type !== "literal") parts[type] = Number(value);
  }
  return parts as { year: number; month: number; day: number; hour: number; minute: number };
}

/** An instant as its New Zealand calendar date: `"9 Oct 2026"`. */
export function formatDate(date: Date): string {
  const { year, month, day } = partsOf(date);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** An instant as New Zealand date and time: `"9 Oct 2026, 2:05 pm"`. */
export function formatDateTime(date: Date): string {
  const { year, month, day, hour, minute } = partsOf(date);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour < 12 ? "am" : "pm";
  return `${day} ${MONTHS[month - 1]} ${year}, ${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A `YYYY-MM-DD` calendar date as the UTC-midnight `Date` Prisma writes to a `date` column. */
export function calendarDateToDb(value: string | null): Date | null {
  if (value === null) return null;
  if (!CALENDAR_DATE.test(value)) throw new RangeError("Expected a YYYY-MM-DD date.");
  return new Date(`${value}T00:00:00Z`);
}

/** A `date` column, which Prisma reads as UTC midnight, back to `YYYY-MM-DD`. Never local time. */
export function calendarDateFromDb(value: Date | null): string | null {
  return value === null ? null : value.toISOString().slice(0, 10);
}
