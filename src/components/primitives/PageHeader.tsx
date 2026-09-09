type PageHeaderProps = {
  /** Pairs with `aria-labelledby` on the page's landmark. */
  id: string;
  eyebrow: string;
  heading: string;
  lead?: string;
};

/** The heading block every standalone route opens with: eyebrow, `h1`, lead.
 *
 *  The sibling of `Section`, which renders an `h2` because the home page's `h1`
 *  belongs to the hero. A route owns its own `h1`, so this renders one and
 *  `Section` never can.
 *
 *  `/resume` deliberately does not use this: its `h1` is the name, and it has
 *  neither an eyebrow nor a lead. */
export function PageHeader({ id, eyebrow, heading, lead }: PageHeaderProps) {
  return (
    <header>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">
        {eyebrow}
      </p>
      <h1
        id={id}
        className="mt-4 max-w-3xl text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {heading}
      </h1>
      {lead ? (
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{lead}</p>
      ) : null}
    </header>
  );
}
