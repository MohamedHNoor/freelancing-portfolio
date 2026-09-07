"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_ITEMS } from "@/lib/site";

/* `name` is passed in rather than read from `@/content` here: this is a
   client component, and importing the content layer would ship every case
   study to the browser just to label the sheet. */
export function MobileNav({ name }: { name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <MenuIcon className="size-[1.15rem]" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(20rem,85vw)] gap-0">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="flex items-center">
            <Logo className="size-10" id="logo-mobile" />
            {/* Radix needs a real title; the mark alone would leave the dialog
                without an accessible name. */}
            <span className="sr-only">{name}</span>
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="p-3">
          <ul className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
