"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/shell/AppSidebar";
import { SignOutButton } from "@/components/dashboard/shell/SignOutButton";
import { workspaceSectionLabel } from "@/lib/dashboard/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Topbar({ name }: { name: string }) {
  const pathname = usePathname();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [navigationMotion, setNavigationMotion] = useState<"pointer" | "instant">("instant");

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="mx-auto flex min-h-20 max-w-workspace items-center justify-between gap-3 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                aria-label="Open workspace navigation"
                className="size-11 lg:hidden"
                onPointerDown={() => setNavigationMotion("pointer")}
                onKeyDown={() => setNavigationMotion("instant")}
              >
                <MenuIcon className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              showCloseButton={false}
              className="workspace-ui workspace-sheet w-[min(20rem,calc(100vw-2rem))] gap-0 bg-card pr-8"
              data-motion={navigationMotion}
              onPointerDownCapture={() => setNavigationMotion("pointer")}
              onKeyDownCapture={() => setNavigationMotion("instant")}
            >
              <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Open the overview or your clients. More workspace tools are coming soon.
              </SheetDescription>
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Close workspace navigation"
                  className="absolute right-2 top-4 size-11"
                >
                  <XIcon className="size-5" aria-hidden="true" />
                </Button>
              </SheetClose>
              <AppSidebar name={name} onNavigate={() => setNavigationOpen(false)} />
            </SheetContent>
          </Sheet>

          <nav aria-label="Breadcrumb" className="min-w-0 truncate text-workspace-sm text-muted-foreground">
            <span aria-current="page">{workspaceSectionLabel(pathname)}</span>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
