"use client";

import {
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { useDialogA11y } from "@/components/ui/use-dialog-a11y";
import { cn } from "@/lib/cn";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogA11y(open, onClose, panelRef);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fermer la fenêtre"
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
          "relative z-10 w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-md outline-none",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fermer">
            ×
          </Button>
        </div>
        <div id={descriptionId} className="text-sm text-foreground">
          {children}
        </div>
        {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

export type DialogPanelProps = HTMLAttributes<HTMLDivElement>;

/** Alias sémantique pour les appels Modal/Dialog du roadmap. */
export function Dialog(props: ModalProps) {
  return <Modal {...props} />;
}
