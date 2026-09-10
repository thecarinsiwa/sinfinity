"use client";

import { Button } from "@/components/ui";
import { useAuth } from "@/components/auth/auth-provider";

export function ForbiddenActions() {
  const { logout, status } = useAuth();

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Button
        type="button"
        onClick={() => void logout()}
        disabled={status === "loading"}
      >
        Se déconnecter
      </Button>
      <a
        href="/system/health"
        className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-muted"
      >
        Santé API
      </a>
    </div>
  );
}
