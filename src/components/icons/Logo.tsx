type LogoProps = {
  className?: string;
  /* Namespaces the clip paths so several instances on one page cannot collide
     on a duplicate element id. */
  id?: string;
};

/* A filled letterform rather than a stroked one: at favicon size a stroke loses
   its thin parts, a solid shape does not. */
const M_PATH =
  "M3 27 L3 5 L9.2 5 L16 14.2 L22.8 5 L29 5 L29 27 L23.6 27 L23.6 13.2 L17.1 21.9 L14.9 21.9 L8.4 13.2 L8.4 27 Z";

/** MHN mark: a solid M split down the centre into two tones, one per service
 *  track. Decorative, because every place it appears pairs it with the name in
 *  visually hidden text. */
/* The glyph occupies roughly 70% of the viewBox height, which gives the mark
   its clear space. The box is therefore deliberately larger than the optical
   size: size-10 renders a 28px M, the right weight in a 64px header. */
export function Logo({ className = "size-10", id = "logo" }: LogoProps) {
  const leftClip = `${id}-left`;
  const rightClip = `${id}-right`;

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={leftClip}>
          <rect x="0" y="0" width="16" height="32" />
        </clipPath>
        <clipPath id={rightClip}>
          <rect x="16" y="0" width="16" height="32" />
        </clipPath>
      </defs>
      <path
        d={M_PATH}
        className="[fill:var(--logo-from)]"
        clipPath={`url(#${leftClip})`}
      />
      <path
        d={M_PATH}
        className="[fill:var(--logo-to)]"
        clipPath={`url(#${rightClip})`}
      />
    </svg>
  );
}
