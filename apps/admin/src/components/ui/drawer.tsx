"use client";

import { useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useDialogA11y } from "@/components/ui/use-dialog-a11y";
import { cn } from "@/lib/cn";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Panel width class — default max-w-xl */
  className?: string;
};

/**
 * Right-side panel for read-only / detail views (e.g. audit old/new JSON).
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogA11y(open, onClose, panelRef);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fermer le tiroir"
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex h-full w-full max-w-xl flex-col border-l border-border bg-surface shadow-md outline-none",
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fermer">
            ×
          </Button>
        </div>
        <div
          id={descriptionId}
          className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm text-foreground"
        >
          {children}
        </div>
        {footer ? (
          <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
