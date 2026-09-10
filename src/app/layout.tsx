import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { getProfile } from "@/content";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { SkipLink } from "@/components/layout/SkipLink";
import { SITE, SITE_URL } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const HOME_TITLE = `${getProfile().name} - Freelance software engineer`;

/* `metadataBase` is what lets every route below declare its canonical, its
   `og:url` and its social image as a path and have Next resolve them against
   the configured origin. Without it Next warns and falls back to a guessed
   origin, which on a preview deployment is not the site.

   Deliberately no `alternates` here. Metadata inherits, so a canonical set on
   the root layout would be adopted by any route that did not override it, and
   a page canonicalized to the home page is worse than a page with no canonical
   at all. Each route declares its own through `routeMetadata`.

   No `og:locale` either: no locale has been chosen for this site, and asserting
   one would be inventing a fact. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  /* The template is the one place the site name is appended to a page title, so
     a route only ever declares the part that is its own and no route can drift
     into a different suffix. `default` is the home page, which has no prefix to
     add. */
  title: {
    default: HOME_TITLE,
    template: `%s - ${getProfile().name}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: getProfile().name,
    title: HOME_TITLE,
    description: SITE.description,
  },
  /* X falls back to `og:image` when no `twitter:image` is present, so declaring
     the card type is enough to get the large card without generating and
     serving a second copy of the same image. */
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    /* Ships with `dark` so the default theme is correct before any script runs,
       including with JavaScript disabled. suppressHydrationWarning covers the
       pre-paint script rewriting this class for a stored light preference.

       `data-scroll-behavior="smooth"` is required because `globals.css` sets
       `scroll-behavior: smooth` on `html` for the in-page anchors. Next 16
       stopped overriding that during route transitions by default, and without
       the attribute a client navigation animates its way down the new page
       instead of starting at the top, which is a bug this project has already
       hit once. The attribute restores the override: instant on navigation,
       smooth for the anchors the declaration exists for. */
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <MotionProvider>
          <SkipLink />
          <Header />
          {/* tabIndex -1 so the skip link actually moves focus here.
             Without it the hash navigates but focus stays on body, and a
             screen reader user tabs from the top again. */}
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
