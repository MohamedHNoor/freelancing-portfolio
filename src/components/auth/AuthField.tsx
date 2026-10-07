"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

export function AuthField({ id, label, error, hint, type, ...props }: AuthFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const description = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-workspace-body font-medium">{label}</Label>
      <div className="relative">
        <Input
          {...props}
          id={id}
          type={isPassword && passwordVisible ? "text" : type}
          aria-invalid={error !== undefined}
          aria-describedby={description || undefined}
          className={isPassword ? "h-11 pl-3 pr-12" : "h-11 px-3"}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute inset-y-0 right-0 size-11 text-muted-foreground"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-controls={id}
            disabled={props.disabled}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {/* Keyed so each toggle remounts the icon and replays the swap. */}
            <span key={String(passwordVisible)} className="workspace-icon-swap flex">
              {passwordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </span>
          </Button>
        )}
      </div>
      {hint && <p id={`${id}-hint`} className="text-workspace-sm text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} className="workspace-reveal text-workspace-sm text-danger">{error}</p>}
    </div>
  );
}
