import { Fragment } from "react";

/** Items separated by middle dots, breaking only after a dot. Each item is kept
 *  whole, so "Ruby on Rails" never splits and no line starts with a dot. The
 *  separators are real text, so a PDF's text layer and an applicant tracking
 *  system still read the items apart; they are hidden from screen readers,
 *  which would otherwise announce each one. */
export function DotList({ items }: { items: readonly string[] }) {
  return (
    <>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <Fragment key={item}>
            <span className="whitespace-nowrap">
              {item}
              {last ? null : <span aria-hidden="true">{" ·"}</span>}
            </span>
            {last ? null : " "}
          </Fragment>
        );
      })}
    </>
  );
}
