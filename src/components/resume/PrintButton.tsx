"use client";

import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/* The only client island on this route, and it exists solely to call
   `window.print()`. Keep it a leaf: making the page a client component to
   accommodate it would ship the whole content layer to the browser.

   `data-print-hidden` is what the print stylesheet keys off, so the button does
   not appear on the sheet it just produced. */
export function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      data-print-hidden=""
      onClick={() => window.print()}
      className="h-11 gap-2 px-5 text-[0.95rem]"
    >
      <PrinterIcon className="size-4" aria-hidden="true" />
      Print or save as PDF
    </Button>
  );
}
