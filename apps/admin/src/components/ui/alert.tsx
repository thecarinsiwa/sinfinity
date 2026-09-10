import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type AlertTone = "info" | "success" | "warning" | "danger";

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  tone?: AlertTone;
  title?: string;
};

const toneClass: Record<AlertTone, string> = {
  info: "border-primary/30 bg-primary/10 text-foreground",
  success: "border-success/30 bg-success/10 text-foreground",
  warning: "border-warning/30 bg-warning/10 text-foreground",
  danger: "border-danger/30 bg-danger/10 text-foreground",
};

export function Alert({
  className,
  tone = "info",
  title,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {title ? <p className="mb-1 font-medium">{title}</p> : null}
      {children ? <div className="text-muted">{children}</div> : null}
    </div>
  );
}
