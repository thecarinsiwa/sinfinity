"use client";

import type { HTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export type SpinnerProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
};

export function Spinner({ className, label, ...props }: SpinnerProps) {
  const t = useTranslations("common");
  const resolvedLabel = label ?? t("loading");

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
      <span>{resolvedLabel}</span>
    </div>
  );
}
