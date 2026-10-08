import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ClientNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-border bg-card px-6 py-10 text-center sm:px-10">
      <h1 className="font-heading text-workspace-title font-semibold">Client not found</h1>
      <p className="mt-3 text-workspace-body leading-relaxed text-muted-foreground">
        This client doesn&apos;t exist, or the link is incomplete.
      </p>
      <Button asChild className="mt-7 min-h-11 px-4">
        <Link href="/dashboard/clients">Back to clients</Link>
      </Button>
    </div>
  );
}
