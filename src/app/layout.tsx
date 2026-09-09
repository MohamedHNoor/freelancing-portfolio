import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { getProfile } from "@/content";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { SkipLink } from "@/components/layout/SkipLink";
import { SITE } from "@/lib/site";
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

export const metadata: Metadata = {
  title: `${getProfile().name} - Freelance developer`,
  description: SITE.description,
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
