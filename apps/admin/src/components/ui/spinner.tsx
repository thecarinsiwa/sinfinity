import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type SpinnerProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function Spinner({
  className,
  label = "Chargement…",
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2 text-sm text-muted", className)}
      {...props}
    >
      <span
        className="size-4 animate-spin rounded-full border-2 border-border border-t-primary"
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
