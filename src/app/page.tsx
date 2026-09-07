import { Reveal } from "@/components/primitives/Reveal";

const SWATCHES = [
  { label: "background", className: "bg-background" },
  { label: "card", className: "bg-card" },
  { label: "muted", className: "bg-muted" },
  { label: "primary", className: "bg-primary" },
  { label: "brand", className: "bg-brand" },
  { label: "destructive", className: "bg-destructive" },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">
        Design system
      </p>
      <h1 className="mt-4 max-w-3xl text-balance font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
        The shell is in place. The content lands next.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
        Brand tokens, the font trio, navigation, the theme toggle, and the
        animation provider are wired. Every section of the real site is built on
        top of this frame.
      </p>

      <Reveal className="mt-16">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Tokens
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Both themes are defined from the same token contract, so every
            component inherits the identity instead of the shadcn default.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {SWATCHES.map((swatch) => (
              <li key={swatch.label}>
                <div
                  className={`h-14 w-full rounded-lg border border-border ${swatch.className}`}
                />
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {swatch.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
