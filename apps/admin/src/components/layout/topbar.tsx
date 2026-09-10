"use client";

import { Badge, Button } from "@/components/ui";
import { useAuth } from "@/components/auth/auth-provider";
import { greetingForHour } from "@/lib/dashboard/format";

type TopbarProps = {
  onMenuClick: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, organization, isSuperAdmin } = useAuth();

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.email
    : "…";

  const greeting = greetingForHour(new Date().getHours());
  const initials = initialsFromName(displayName);

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border/70 bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex min-w-0 items-center gap-3">
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
        <div className="min-w-0 animate-[dash-fade_0.45s_ease-out]">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground md:text-xl">
            {greeting}, {displayName}
            {isSuperAdmin ? (
              <Badge tone="primary" className="ml-2 align-middle">
                Super
              </Badge>
            ) : null}
          </h1>
          <p className="truncate text-sm text-muted">
            {organization?.name ?? "Organisation"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 rounded-full border border-border/80 bg-surface py-1 pr-3 pl-1 shadow-sm">
        <span
          className="inline-flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
          aria-hidden
        >
          {initials}
        </span>
        <div className="hidden min-w-0 sm:block">
          <p className="max-w-[10rem] truncate text-sm font-medium text-foreground">
            {displayName}
          </p>
          <p className="max-w-[10rem] truncate text-xs text-muted">
            {user?.email ?? ""}
          </p>
        </div>
      </div>
    </header>
  );
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
