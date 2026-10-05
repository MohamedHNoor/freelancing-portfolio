import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { SkipLink } from "@/components/layout/SkipLink";

/** The site header, main landmark and footer around a page.
 *
 *  Not in the root layout, because `/resume` is a standalone document and must
 *  not carry the marketing navigation. The `(site)` route group renders this
 *  for every other page, and the root `not-found.tsx` renders it too, since an
 *  unmatched URL never enters that group. */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <MotionProvider>
      <SkipLink />
      <Header />
      {/* tabIndex -1 so the skip link actually moves focus here. Without it
          the hash navigates but focus stays on body, and a screen reader user
          tabs from the top again. */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 focus:outline-none"
      >
        {children}
      </main>
      <Footer />
    </MotionProvider>
  );
}
