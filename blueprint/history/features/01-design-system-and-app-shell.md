# Feature: Design system and app shell

**From build-plan:** feature 1

**Branch:** feature/design-system-and-app-shell

**Status:** verified

## Goal

Replace the create-next-app scaffold with the project's own visual identity and
page chrome: brand token values over the shadcn base, the display/body/mono font
trio, a header with navigation, a mobile menu, a footer, a theme toggle that
survives reload without a flash, and the LazyMotion provider every later feature
animates through.

Nothing on this branch is content. Feature 1 makes the frame that features 2 to
12 fill, and it fixes the token, font, accessibility, and animation contracts so
later features do not each invent their own.

## Design reference

`design/website-ui-design.png` (already tracked in the repository and cited by
both planning docs, so it is linked rather than copied into
`blueprint/reference/`).

Take from it: layered near-black surfaces, a violet accent, generous section
rhythm, rounded card language, a technical and confident tone rather than a
playful one.

Do not take from it: the stat tiles, the skill percentage bars, or the Blog
navigation item. All three were removed deliberately in `project-plan.md`.

## In scope

- Brand token values written over the shadcn `:root` and `.dark` blocks, both
  themes, AA verified
- Font trio wired through `next/font/google` and the existing `@theme inline`
  font tokens, replacing Geist
- A base reduced-motion rule so every later animation collapses by default
- `src/lib/site.ts` (site identity, navigation items) and `src/lib/theme.ts`
  (theme type, storage key, pre-paint script)
- Root layout landmarks: skip link, `header`, `main`, `footer`
- A split-M monogram logo mark used alone in the header, footer, and mobile
  sheet, plus the matching app icon at `src/app/icon.svg`
- Header with the desktop navigation and the theme toggle
- Mobile navigation in a shadcn `sheet`
- Footer with the navigation repeat and a copyright line
- `MotionProvider` and one `Reveal` primitive that proves the LazyMotion strict
  contract works
- Root metadata title and description replacing "Create Next App"
- A minimal placeholder home page so the shell is reviewable
- Scaffold cleanup: the five unused `public/*.svg` files and the starter markup

## Out of scope

- Any real content. The profile, services, skills, experience, and project
  modules are feature 2, and every section that fills the home page is features
  3 to 5.
- `/projects`, `/projects/[slug]`, and `/resume` routes, and therefore any
  navigation item pointing at them. Those arrive with features 6, 7, and 8.
- Social links (GitHub, LinkedIn, mailto). They belong to `profile.links` in the
  content layer, and the real handles are not supplied yet. Do not invent URLs.
- `metadataBase`, canonicals, Open Graph tags, `sitemap.ts`, `robots.ts`,
  generated social images, JSON-LD, and the app icon set. All feature 10.
- The contact form, the Server Action, and Resend. Feature 9.
- Lighthouse scoring and the bundle budget. Feature 11 owns the numeric gate;
  feature 1 only has to not obviously break it.

## Build loop

`workflow.stepReview` is `feature` and `workflow.checkpointCommits` is
`disabled`. Implement the steps below in order without stopping for approval
after each one, then present a single review packet covering the whole feature.
No checkpoint commits. `/complete` creates the one feature commit.

## Build steps

- [x] 1. **Brand palette, fonts, and the motion baseline.** In
  `src/app/globals.css`, keep the generated contract untouched (the
  `@import "shadcn/tailwind.css"` line, `@custom-variant dark`, the `@theme
  inline` mappings, the `@layer base` block) and replace only the `:root` and
  `.dark` variable *values* with the brand palette: near-black violet-biased
  surfaces, a violet primary, a matching ring, and a light theme that is a real
  design rather than an inverted afterthought. Set `color-scheme` per theme. Point
  the three font tokens at the trio: `--font-heading` at Space Grotesk,
  `--font-sans` at Inter, `--font-mono` at JetBrains Mono. In
  `src/app/layout.tsx`, swap `Geist`/`Geist_Mono` for those three via
  `next/font/google` with matching CSS variable names. Add a base
  `@media (prefers-reduced-motion: reduce)` rule that reduces animation and
  transition durations to near zero for all elements, so `tw-animate-css` and
  Radix animations honour it without per-component work.
  **Done when:** `npx tsc --noEmit` and `npm run lint` are clean, `npm run build`
  succeeds, no `--font-geist-sans` or `--font-geist-mono` reference remains
  anywhere in the repository, and in the browser the computed `font-family` on
  `body` is Inter and on a `font-mono` element is JetBrains Mono rather than a
  fallback stack.

- [x] 2. **Site config, layout landmarks, and scaffold cleanup.** Add
  `src/lib/site.ts` with `SITE` and `NAV_ITEMS` as specified under Data /
  contracts. Rewrite `src/app/layout.tsx` to render, in order, the skip link, a
  `header`, `main` with `id="main-content"` and a grow class so the footer sits at
  the bottom of short pages, and a `footer`. Header and footer are placeholder
  elements at this step; steps 4 and 6 fill them. Replace the scaffold `metadata`
  export with a title and description built from `SITE`. Replace
  `src/app/page.tsx` with a minimal placeholder home page carrying exactly one
  `h1`. Delete `public/file.svg`, `public/globe.svg`, `public/next.svg`,
  `public/vercel.svg`, and `public/window.svg`.
  **Done when:** the build succeeds, `/` renders with no Next.js starter text or
  logo, the browser tab title is the new title, tabbing from a fresh page load
  reveals the skip link first and activating it moves focus into `main`, and
  `grep -r "next.svg\|vercel.svg\|window.svg\|globe.svg\|file.svg" src public`
  returns nothing.

- [x] 3. **Theme persistence and toggle.** Add `src/lib/theme.ts` per Data /
  contracts. Render the init script in the layout `head` before paint, and add
  `suppressHydrationWarning` to `html`. Server-render `class="dark"` on `html` so
  a first visit and a no-JS visit both land on the dark default with no flash. Add
  `src/components/layout/ThemeToggle.tsx` as a client island using the shadcn
  `button` (add it with `npx shadcn@latest add button` in this step) and a lucide
  icon pair.
  **Done when:** switching the theme flips both the `.dark` class and
  `color-scheme` and the change survives a reload with no flash of the wrong
  theme; a stored value of `"light"` restores light; a hand-set junk value and an
  absent value both resolve to dark; with `localStorage` blocked the page still
  loads dark and the toggle still flips for the session without throwing in the
  console; the toggle has a visible focus ring, is reachable by keyboard, and its
  accessible name states the action it will perform.

- [x] 4. **Header and desktop navigation.** Add
  `src/components/layout/Header.tsx` as a server component rendering the wordmark
  linking to `/`, `NAV_ITEMS` inside a `nav` with an accessible name, and the
  theme toggle. Sticky, with a translucent blurred background over the page
  surface. The desktop navigation is hidden below the `md` breakpoint.
  **Done when:** at 1440 and 768 the header shows the wordmark, all six
  navigation items, and the toggle; every item and the wordmark are reachable by
  keyboard in visual order with a visible focus ring; the header stays fixed on
  scroll without covering focused content; at 390 the desktop navigation is not
  rendered.

- [x] 5. **Mobile navigation sheet.** Add
  `src/components/layout/MobileNav.tsx` as a client island using the shadcn
  `sheet` (`npx shadcn@latest add sheet`). It is the only navigation shown below
  `md`. Give the sheet a `SheetTitle` (visually hidden if it is not shown) so
  Radix has an accessible name, and close the sheet when a navigation item is
  activated.
  **Done when:** at 390 the trigger opens the sheet; focus moves into it; Tab
  cycles inside it and does not reach the page behind; Escape closes it and
  returns focus to the trigger; activating a navigation item closes the sheet and
  moves to the anchor; the page behind does not scroll while it is open; with
  `prefers-reduced-motion: reduce` emulated the sheet appears without a slide.

- [x] 6. **Footer.** Add `src/components/layout/Footer.tsx` as a server component
  with the wordmark, the same `NAV_ITEMS`, and a copyright line whose year is
  computed at build time. No social or contact links at this step.
  **Done when:** the footer renders at 390, 768, and 1440 without horizontal
  overflow, sits at the bottom of the viewport on the short placeholder home page
  rather than floating mid-screen, and its links are keyboard reachable with a
  visible focus ring.

- [x] 7. **Motion provider and the Reveal primitive.** Add
  `src/components/layout/MotionProvider.tsx` as a client component wrapping
  `{children}` in `<LazyMotion features={domAnimation} strict>`, mounted in the
  root layout so server children pass through as children and stay server
  rendered. Add `src/components/primitives/Reveal.tsx`, a client component that
  animates its children in on scroll using the code-split `m` element,
  `whileInView` with `viewport={{ once: true, amount: 0.3 }}`, transform and
  opacity only, and collapses to no distance and no fade when `useReducedMotion()`
  is true. Apply it to one element on the placeholder home page so the contract is
  exercised.
  **Done when:** the build succeeds with `strict` on, proving no full `motion`
  import slipped in; the revealed element animates once on scroll and does not
  re-animate on scroll back; with `prefers-reduced-motion: reduce` emulated the
  element is visible immediately with no transform and no fade; the element is
  present and readable in the page source rather than starting hidden from
  assistive technology.

- [x] 8. **Accessibility, responsive, and build verification.** Run the whole
  shell through the checks this project sells: contrast, keyboard, reduced motion,
  three widths, both themes.
  **Done when:** measured contrast is at least 4.5:1 for `foreground` on
  `background`, `muted-foreground` on `background`, `foreground` on `card`, and
  `primary-foreground` on `primary` in both themes, and at least 3:1 for focus
  rings and borders against their adjacent surface, with the measured ratios
  recorded in the review packet; a keyboard-only pass reaches every interactive
  element in both themes with a visible ring and no trap outside the sheet; the
  heading order on `/` is a single `h1` with no skipped level; screenshots exist
  at 390, 768, and 1440 in both themes; `npx tsc --noEmit`, `npm run lint`, and
  `npm run build` are clean and the build route table still shows `/` as static.

## Files / areas

Created:

- `src/lib/site.ts`
- `src/lib/theme.ts`
- `src/components/icons/Logo.tsx`
- `src/app/icon.svg` (replaces the scaffold `favicon.ico`)
- `src/components/layout/SkipLink.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/MobileNav.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/ThemeToggle.tsx`
- `src/components/layout/MotionProvider.tsx`
- `src/components/primitives/Reveal.tsx`
- `src/components/ui/button.tsx` and `src/components/ui/sheet.tsx` (written by
  `npx shadcn@latest add`, then restyled to the brand only where the stock look
  fights the reference)

Modified:

- `src/app/globals.css` - token values, font tokens, `color-scheme`, the base
  reduced-motion rule. The generated structure stays.
- `src/app/layout.tsx` - fonts, metadata, theme script, landmarks, providers
- `src/app/page.tsx` - placeholder home page

Deleted:

- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`,
  `public/window.svg`

Untouched: `components.json`, `next.config.ts`, `tsconfig.json`,
`src/lib/utils.ts`, `src/app/favicon.ico`.

## Data / contracts

**`src/lib/site.ts`**

- `SITE`: `{ name: string; description: string }`. `name` is a flagged
  placeholder brand string, not a person's name and not a real company; it feeds
  the wordmark and the metadata title. `description` is the one-line site
  description used by root metadata. A short comment must record that both are
  placeholders pending the identity open question.
- `NAV_ITEMS`: `readonly { label: string; href: string }[]`, in this exact order,
  because it is the contract features 3 to 5 must satisfy when they add sections:

  | label | href |
  |---|---|
  | About | `#about` |
  | Services | `#services` |
  | Projects | `#projects` |
  | Skills | `#skills` |
  | Experience | `#experience` |
  | Contact | `#contact` |

  Every entry is a same-page anchor, so no link in this feature can 404. The
  anchor targets do not exist yet; features 3 to 5 must give their sections these
  exact `id` values. Route-level items (`/projects`, `/resume`) are added by
  features 6 and 8, and the feature that adds the first route item also owns the
  `aria-current="page"` rule from the coding standards, which cannot apply while
  every item is an anchor.

**`src/lib/theme.ts`**

- `type Theme = "dark" | "light"`. There is no "system" option: the overview
  fixes dark as the default and light as a supported alternative, so the toggle
  is binary.
- `THEME_STORAGE_KEY = "theme"`, a single exported constant used by both the
  pre-paint script and the toggle so the key is never written twice.
- Resolution rule, applied identically by the script and the toggle: stored
  `"light"` gives light; stored `"dark"`, any other stored string, a missing key,
  or a `localStorage` access that throws all give dark.
- `THEME_INIT_SCRIPT`: a string injected in `head` and executed before paint. It
  must be wrapped in `try`/`catch` so a browser with storage disabled falls back
  to dark silently rather than throwing before hydration. It sets or removes the
  `dark` class and sets `color-scheme` on `document.documentElement`.
- Persistence writes from the toggle are also wrapped so a failed write leaves
  the theme applied for the session instead of breaking the click.
- Serialized form in storage is the bare string `"dark"` or `"light"`, no JSON
  wrapper, because the pre-paint script has to read it with minimal inline code.

**Server-rendered default**

`html` ships with `class="dark"`, `suppressHydrationWarning`, and `lang="en"`.
Dark is therefore correct with JavaScript disabled and for a first-time visitor,
and the script only ever has work to do when a light preference was stored.

**Client and server split**

Client islands in this feature, and only these: `ThemeToggle`, `MobileNav`,
`MotionProvider`, `Reveal`. `Header`, `Footer`, `SkipLink`, the layout, and the
page stay server components. `MotionProvider` wraps `{children}` so server
children are passed through rather than pulled into the client bundle.

**Security and text handling**

No user input, no forms, no persisted server data, no authenticated actor, and no
tenant boundary in this feature. The only browser-owned value is the theme
string, and it is never interpolated into markup, only compared against two known
values. Nothing here renders user-controlled text.

## Testing

`AGENTS.md` declares no test command and no browser test command, so this feature
adds no test files. Per the coding standards the testing gate is off until
`/tests` runs. Verification is the build, `npx tsc --noEmit`, `npm run lint`, and
browser evidence through the Playwright MCP tools against `npm run dev`, at 390,
768, and 1440 in both themes.

When `/tests` lands before feature 9, the theme resolution rule in
`src/lib/theme.ts` is the one piece of pure logic here worth a retrospective
test: stored light, stored dark, unknown string, missing key, throwing storage.
Keep the resolution as a plain exported function rather than inline branching so
that test seam exists without rework.

## Notes for the AI

- The shadcn block in `globals.css` is a contract, not a suggestion. Replace
  variable *values*, never the `@theme inline` mapping, the `@custom-variant`
  line, the `@import "shadcn/tailwind.css"` line, or the `@layer base` rules.
- The generated file currently maps `--font-mono` to `var(--font-geist-mono)` and
  `--font-sans` to `var(--font-sans)`. The first dangles the moment Geist is
  removed and the second is self-referential, which is why step 1's done-when
  checks the computed font rather than trusting the CSS to look right.
- Use the existing `--font-heading` token for the display face rather than
  introducing a second `--font-display` token for the same job. One name per
  decision.
- Do not restore the stock neutral shadcn values at any point, and re-check
  contrast whenever a token pair changes.
- Motion imports come from `motion/react-m` as `m`. `strict` is on, so a full
  `motion` import is a build error; that is the point, do not work around it.
- `Reveal` must never wrap the largest contentful element. Feature 3's hero
  headline in particular is excluded, and this note carries forward to it.
- Add only `button` and `sheet` from shadcn in this feature. The rest arrive with
  the features that need them.
- Brand technology marks are inline SVG in `src/components/icons/` when features
  4 and 5 need them. Do not add a second icon dependency; lucide ships with
  shadcn and covers the interface icons this feature needs.
- Do not add social links, an email address, a real name, or a CV link. That
  content is not supplied yet and inventing it is the exact failure mode the
  placeholder flag exists to prevent.
- Do not start writing sections, cards, or copy beyond the single placeholder
  heading. This branch should be reviewable as "the frame is right".

## Open questions

- **The brand wordmark string. Resolved during implementation.** The real name
  was supplied and `SITE.name` now holds it, so no placeholder ships. Remaining
  person-level content (bio, links, availability) still belongs to feature 2.
- **Custom domain. Still open, still not blocking.** This feature sets only a
  title and a description, so `metadataBase` and `NEXT_PUBLIC_SITE_URL` stay a
  feature 10 concern.

## What changed during implementation

Six decisions differ from the spec as written. All were forced by evidence
rather than preference.

1. **`ThemeToggle` uses `useSyncExternalStore`, not state plus an effect.** The
   React Compiler lint rule `react-hooks/set-state-in-effect` rejects the
   effect form. Subscribing to the `class` attribute via `MutationObserver`
   makes the DOM the single source of truth, so the label can never disagree
   with the applied theme.
2. **`THEME_INIT_SCRIPT` serialises `resolveTheme` rather than restating the
   rule.** This leaves exactly one definition of the resolution rule. Verified
   in the production bundle: it minifies to
   `function(a){return"light"===a?"light":"dark"}`.
3. **Reduced motion is handled by `MotionConfig reducedMotion="user"`, not by
   `useReducedMotion()` inside `Reveal`.** Branching a component's rendered
   style on that hook diverges the server and client renders. It produced a real
   hydration mismatch and left a permanent 16px offset under reduced motion.
4. **`<main>` carries `tabIndex={-1}`.** Without it the skip link updated the
   hash but left focus on `body`, which defeats the skip link for the users it
   exists for. Found by the keyboard pass, not by reading the code.
5. **The shadcn `outline` button variant was retuned from `border-border` to
   `border-input`.** In the light theme `--border` measures 1.31:1, which is
   correct for a decorative divider but not for a control boundary under WCAG
   1.4.11. `--input` measures 3.15:1.
6. **A logo mark and the name-versus-brand decision were added on review.**
   The reference uses an invented studio name ("CodeCraft") and a generic `</>`
   glyph. Both were rejected on purpose. A studio name would mismatch the Upwork
   proposal, the profile, LinkedIn, and GitHub at the exact moment a client with
   no reviews to read is deciding whether this is real, and it implies a team
   that does not exist. The wordmark is therefore the developer's own name, and
   the mark is a solid M split down the centre into two flat tones, violet into
   blue, used alone with no visible wordmark beside it. Three earlier attempts
   were rejected on review and the reasons are worth keeping: a gradient tile
   read as a generic SaaS app icon rather than a person, three letters inside a
   small container forced strokes too thin to survive the header, and a
   magenta-to-blue gradient dated the mark. A filled letterform was chosen over
   a stroked one because a stroke loses its thin parts at favicon size. The two
   tones map to the two service tracks without stating it. Its colours live in
   `--logo-from` and `--logo-to`, tuned per theme.
   Revisit a studio brand only once there are reviews and subcontractors.

   Two consequences carry forward. **`SITE.name` must never be blank**: it is no
   longer a visible wordmark, but it still supplies the metadata title, the
   footer copyright, and the accessible name of the logo link, which is
   otherwise a bare SVG that announces as an unnamed link. **Feature 3 must put
   the full name prominently in the hero**, because the chrome no longer carries
   it anywhere a sighted visitor can read.

7. **One token was added beyond the shadcn set: `--brand`.** Accent text on a
   near-black surface needs a different luminance from an accent surface. The
   violet that passes AA as a label (9.40:1 in dark) is not the violet that
   works as a button fill.
