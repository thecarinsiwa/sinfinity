"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { filterNavItems } from "@/components/layout/filter-nav-items";
import {
  APP_NAV_ITEMS,
  NAV_GROUP_LABELS,
  NAV_GROUP_ORDER,
  type NavGroupId,
  type NavItem,
} from "@/components/layout/nav-items";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

type SidebarProps = {
  open: boolean;
  onNavigate?: () => void;
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupItems(items: NavItem[]): Array<{
  id: NavGroupId;
  label: string;
  items: NavItem[];
}> {
  return NAV_GROUP_ORDER.map((id) => ({
    id,
    label: NAV_GROUP_LABELS[id],
    items: items.filter((item) => item.group === id),
  })).filter((group) => group.items.length > 0);
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { permissions, isSuperAdmin, logout, status, organization } =
    useAuth();

  const items = filterNavItems(APP_NAV_ITEMS, permissions, isSuperAdmin);
  const groups = groupItems(items);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-[17.5rem] flex-col border-r border-border/80 bg-surface transition-transform duration-200 md:static md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-start gap-3 px-5 pt-5 pb-4">
        <div
          className="mt-0.5 grid size-9 shrink-0 grid-cols-2 gap-0.5 rounded-lg bg-primary/10 p-1.5"
          aria-hidden
        >
          <span className="rounded-sm bg-primary" />
          <span className="rounded-sm bg-primary/50" />
          <span className="rounded-sm bg-primary/50" />
          <span className="rounded-sm bg-primary" />
        </div>
        <div className="min-w-0">
          <Link
            href="/"
            onClick={onNavigate}
            className="block truncate text-base font-semibold tracking-tight text-foreground"
          >
            Sinfinity
          </Link>
          <p className="truncate text-xs text-muted">
            {organization?.name ? `${organization.name} · Admin` : "Console Admin"}
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "relative rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-surface-muted text-primary"
                      : "text-foreground/80 hover:bg-surface-muted/70 hover:text-foreground",
                  )}
                >
                  {active ? (
                    <span
                      className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                      aria-hidden
                    />
                  ) : null}
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border/80 p-3">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start rounded-xl text-muted hover:text-foreground"
          onClick={() => void logout()}
          disabled={status === "loading"}
        >
          Déconnexion
        </Button>
      </div>
    </aside>
  );
}
