import Link from "next/link";
import { DownloadIcon } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PrintButton } from "@/components/resume/PrintButton";
import { Button } from "@/components/ui/button";

type ResumeToolbarProps = {
  name: string;
  /** Set once a CV file exists in `public/`; the download appears with it. */
  cvHref?: string;
};

/** The resume's own header, in place of the site navigation: the mark back to
 *  the home page, the theme, and the PDF. Not sticky, because this route is a
 *  document, and screen only. */
export function ResumeToolbar({ name, cvHref }: ResumeToolbarProps) {
  return (
    <header data-print-hidden="" className="border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <Logo loading="eager" />
          <span className="sr-only">{name}, home page</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {cvHref !== undefined ? (
            <Button asChild variant="outline" size="lg" className="gap-2 px-3 sm:px-4">
              <a href={cvHref} download>
                <DownloadIcon className="size-4" aria-hidden="true" />
                Download CV
              </a>
            </Button>
          ) : null}
          <PrintButton />
        </div>
      </div>
    </header>
  );
}
