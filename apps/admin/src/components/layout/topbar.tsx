"use client";

import { Button } from "@/components/ui";
import { useAuth } from "@/components/auth/auth-provider";

type TopbarProps = {
  onMenuClick: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, organization, logout, status } = useAuth();

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.email
    : "…";

  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
        >
          ☰
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {organization?.name ?? "Organisation"}
          </p>
          <p className="truncate text-xs text-muted">{displayName}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void logout()}
        disabled={status === "loading"}
      >
        Déconnexion
      </Button>
    </header>
  );
}
