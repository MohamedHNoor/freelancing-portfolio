"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveIcon, LoaderCircleIcon } from "lucide-react";
import { archiveClient } from "@/actions/clients";
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

/** The id of the server-rendered notice an archived client's page shows. */
export const CLIENT_STATUS_ID = "client-status";

/**
 * Stays mounted after the client is archived (it renders nothing then), so it
 * can move focus to the page's archived notice once the refresh has rendered it.
 */
export function ArchiveClientButton({
  clientId,
  displayName,
  archived,
}: {
  clientId: string;
  displayName: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const justArchived = useRef(false);

  useEffect(() => {
    if (archived && justArchived.current) {
      justArchived.current = false;
      document.getElementById(CLIENT_STATUS_ID)?.focus();
    }
  }, [archived]);

  if (archived) return null;

  function confirm() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await archiveClient(clientId);
      if (!result.success) {
        setError(result.error.message);
        return;
      }
      justArchived.current = true;
      setOpen(false);
      router.refresh();
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
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" className="min-h-11 px-4">
          <ArchiveIcon className="size-4" aria-hidden="true" />
          Archive client
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="workspace-ui">
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {displayName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Archived clients move to the Archived list and can no longer be edited. There is no way to
            restore them yet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-soft p-3 text-workspace-body text-danger">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="min-h-11">Cancel</AlertDialogCancel>
          <Button type="button" onClick={confirm} disabled={pending} aria-busy={pending} className="min-h-11">
            {pending && <LoaderCircleIcon className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
            {pending ? "Archiving…" : "Archive client"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
