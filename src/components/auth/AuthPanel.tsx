import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function AuthPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="workspace-surface workspace-enter w-full max-w-md rounded-2xl border-border bg-card py-0">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-8 space-y-2">
          <p className="mb-4 text-xs font-medium text-muted-foreground">Private workspace</p>
          <h1 id="auth-heading" className="font-heading text-workspace-title font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-workspace-body leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
