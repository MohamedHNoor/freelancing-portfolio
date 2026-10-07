import type { ReactNode } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Full-width submit with the same pending spinner as the dashboard's sign-out. */
export function AuthSubmitButton({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
}) {
  return (
    <Button type="submit" disabled={pending} className="h-11 w-full">
      {pending && <LoaderCircleIcon className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
