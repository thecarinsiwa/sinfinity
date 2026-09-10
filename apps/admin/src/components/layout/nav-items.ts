export type NavItem = {
  label: string;
  href: string;
  /** If null, visible to any authenticated admin session. */
  permission: string | null;
};

export const APP_NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/", permission: null },
  { label: "Organisation", href: "/organisation", permission: "organizations.read" },
  { label: "Utilisateurs", href: "/utilisateurs", permission: "users.read" },
  { label: "Rôles", href: "/roles", permission: "roles.read" },
  { label: "Paramètres", href: "/parametres", permission: "settings.read" },
  { label: "Documents", href: "/documents", permission: "documents.read" },
  { label: "Catalogue", href: "/catalogue", permission: "catalog.read" },
  { label: "Audit", href: "/audit", permission: "audit.read" },
  { label: "Système", href: "/systeme", permission: "system_settings.read" },
];
