import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export type FieldControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": boolean;
  "aria-required": boolean | undefined;
};

/**
 * Label, hint and error around any control, mirroring `AuthField`: the hint and
 * error are linked through `aria-describedby`, and the required marker is text,
 * not just a symbol.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required = false,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (control: FieldControlProps) => ReactNode;
}) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-workspace-body font-medium">
        {label}
        {required && <span className="font-normal text-muted-foreground">(required)</span>}
      </Label>
      {children({
        id,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error !== undefined,
        "aria-required": required || undefined,
      })}
      {hint && <p id={`${id}-hint`} className="text-workspace-sm text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} className="workspace-reveal text-workspace-sm text-danger">{error}</p>}
    </div>
  );
}
