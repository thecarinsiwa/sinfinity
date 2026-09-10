/** Cookie names — safe for Edge middleware (no next/headers). */
export const ACCESS_COOKIE = "sinfinity_access";
export const REFRESH_COOKIE = "sinfinity_refresh";

/**
 * Au moins une de ces permissions (ou isSuperAdmin) ouvre la console Admin.
 * Aligné sur apps/admin/docs/ROADMAP.md phase 1 guards.
 */
export const ADMIN_GATE_PERMISSIONS = [
  "users.read",
  "roles.read",
  "organizations.read",
  "settings.read",
  "audit.read",
  "system_settings.read",
  "documents.read",
  "catalog.read",
] as const;

export type AdminGatePermission = (typeof ADMIN_GATE_PERMISSIONS)[number];
