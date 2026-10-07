"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon, LogOutIcon } from "lucide-react";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const SIGN_OUT_FAILURE = "We couldn’t sign you out. Please try again.";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (errorMessage) errorRef.current?.focus();
  }, [errorMessage]);

  function handleSignOut() {
    if (isPending) return;
    setErrorMessage(null);
    startTransition(async () => {
      const result = await signOut();
      if (!result.success) {
        setErrorMessage(SIGN_OUT_FAILURE);
        return;
      }
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={handleSignOut}
        disabled={isPending}
        aria-busy={isPending}
        className="min-h-11 min-w-32 px-3 text-workspace-sm"
      >
        {isPending ? (
          <LoaderCircleIcon className="size-4 motion-safe:animate-spin" aria-hidden="true" />
        ) : (
          <LogOutIcon className="size-4" aria-hidden="true" />
        )}
        {isPending ? "Signing out…" : "Sign out"}
      </Button>
      <p
        ref={errorRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
        className={errorMessage
          ? "absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-border bg-card p-3 text-workspace-sm leading-relaxed text-danger shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          : "sr-only"}
      >
        {errorMessage}
      </p>
    </div>
  );
}
