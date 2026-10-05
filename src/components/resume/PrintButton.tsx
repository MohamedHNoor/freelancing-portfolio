"use client";

import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/* The only client island on this route besides the theme toggle, and it
   exists solely to call `window.print()`. Keep it a leaf: making the page a
   client component to accommodate it would ship the whole content layer to the
   browser.

   `data-print-hidden` is what the print stylesheet keys off, so the button does
   not appear on the sheet it just produced. Browser printing produces a PDF
   with a real text layer, which is why there is no PDF library here.

   The phone label is shorter so the resume header fits at 360px. Only one of
   the two spans is ever displayed, so the accessible name always matches the
   visible text. */
export function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      data-print-hidden=""
      onClick={() => window.print()}
      className="gap-2 px-3 sm:px-4"
    >
      <PrinterIcon className="size-4" aria-hidden="true" />
      <span className="sm:hidden">Save as PDF</span>
      <span className="hidden sm:inline">Print or save as PDF</span>
    </Button>
  );
}
