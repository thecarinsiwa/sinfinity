"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { filterNavItems } from "@/components/layout/filter-nav-items";
import { APP_NAV_ITEMS } from "@/components/layout/nav-items";
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

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { permissions, isSuperAdmin } = useAuth();

  const items = filterNavItems(APP_NAV_ITEMS, permissions, isSuperAdmin);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200 md:static md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          Sinfinity <span className="text-primary">Admin</span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-surface-muted",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
