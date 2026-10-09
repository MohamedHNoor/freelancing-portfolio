"use client";

import { useState, useTransition, type ReactNode } from "react";
import { LoaderCircleIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * A confirm step before a consequential change, following `ArchiveClientButton`.
 * `onConfirm` returns an error message to show in the dialog, or null to close
 * it. While pending the dialog cannot be dismissed, and on close Radix returns
 * focus to the trigger.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  pendingLabel,
  destructive = false,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const failure = await onConfirm();
      if (failure === null) setOpen(false);
      else setError(failure);
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="workspace-ui">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft p-3 text-workspace-body text-danger">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="min-h-11">Keep it</AlertDialogCancel>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={confirm}
            disabled={pending}
            aria-busy={pending}
            className="min-h-11"
          >
            {pending && <LoaderCircleIcon className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
