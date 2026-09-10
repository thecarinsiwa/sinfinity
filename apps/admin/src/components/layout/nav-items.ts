export type NavGroupId = "general" | "references" | "governance";

export type NavItem = {
  label: string;
  href: string;
  /** If null, visible to any authenticated admin session. */
  permission: string | null;
  group: NavGroupId;
};

export const NAV_GROUP_LABELS: Record<NavGroupId, string> = {
  general: "Général",
  references: "Référentiels",
  governance: "Gouvernance",
};

export const NAV_GROUP_ORDER: NavGroupId[] = [
  "general",
  "references",
  "governance",
];

export const APP_NAV_ITEMS: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/",
    permission: null,
    group: "general",
  },
  {
    label: "Organisation",
    href: "/organisation",
    permission: "organizations.read",
    group: "general",
  },
  {
    label: "Agences",
    href: "/organisation/agences",
    permission: "branches.read",
    group: "general",
  },
  {
    label: "Utilisateurs",
    href: "/utilisateurs",
    permission: "users.read",
    group: "general",
  },
  {
    label: "Rôles",
    href: "/roles",
    permission: "roles.read",
    group: "general",
  },
  {
    label: "Paramètres",
    href: "/parametres",
    permission: "settings.read",
    group: "references",
  },
  {
    label: "Documents",
    href: "/documents",
    permission: "documents.read",
    group: "references",
  },
  {
    label: "Catalogue",
    href: "/catalogue",
    permission: "catalog.read",
    group: "references",
  },
  {
    label: "Audit",
    href: "/audit",
    permission: "audit.read",
    group: "governance",
  },
  {
    label: "Connexions",
    href: "/audit/connexions",
    permission: "audit.read",
    group: "governance",
  },
  {
    label: "Système",
    href: "/systeme",
    permission: "system_settings.read",
    group: "governance",
  },
];
