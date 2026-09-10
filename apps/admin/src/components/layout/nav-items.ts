export type NavGroupId = "general" | "references" | "governance";

export type NavItemId =
  | "dashboard"
  | "organization"
  | "branches"
  | "users"
  | "roles"
  | "settings"
  | "documents"
  | "catalogue"
  | "audit"
  | "loginLogs"
  | "system";

export type NavItem = {
  /** Clé sous `nav.items.*` */
  id: NavItemId;
  href: string;
  /** If null, visible to any authenticated admin session. */
  permission: string | null;
  group: NavGroupId;
};

export const NAV_GROUP_ORDER: NavGroupId[] = [
  "general",
  "references",
  "governance",
];

export const APP_NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    href: "/",
    permission: null,
    group: "general",
  },
  {
    id: "organization",
    href: "/organisation",
    permission: "organizations.read",
    group: "general",
  },
  {
    id: "branches",
    href: "/organisation/agences",
    permission: "branches.read",
    group: "general",
  },
  {
    id: "users",
    href: "/utilisateurs",
    permission: "users.read",
    group: "general",
  },
  {
    id: "roles",
    href: "/roles",
    permission: "roles.read",
    group: "general",
  },
  {
    id: "settings",
    href: "/parametres",
    permission: "settings.read",
    group: "references",
  },
  {
    id: "documents",
    href: "/documents",
    permission: "documents.read",
    group: "references",
  },
  {
    id: "catalogue",
    href: "/catalogue",
    permission: "catalog.read",
    group: "references",
  },
  {
    id: "audit",
    href: "/audit",
    permission: "audit.read",
    group: "governance",
  },
  {
    id: "loginLogs",
    href: "/audit/connexions",
    permission: "audit.read",
    group: "governance",
  },
  {
    id: "system",
    href: "/systeme",
    permission: "system_settings.read",
    group: "governance",
  },
];
