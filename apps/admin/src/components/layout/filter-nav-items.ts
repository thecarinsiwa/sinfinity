import type { NavItem } from "@/components/layout/nav-items";
import { canAccessPermission } from "@/lib/auth/admin-access";

export function filterNavItems(
  items: NavItem[],
  permissions: string[],
  isSuperAdmin: boolean,
): NavItem[] {
  return items.filter((item) =>
    canAccessPermission(permissions, isSuperAdmin, item.permission),
  );
}
