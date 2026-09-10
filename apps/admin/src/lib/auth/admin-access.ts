import {
  ADMIN_GATE_PERMISSIONS,
  type AdminGatePermission,
} from "@/lib/auth/constants";

export function hasAdminConsoleAccess(input: {
  isSuperAdmin: boolean;
  permissions: string[];
}): boolean {
  if (input.isSuperAdmin) {
    return true;
  }
  return ADMIN_GATE_PERMISSIONS.some((code) =>
    input.permissions.includes(code),
  );
}

export function canAccessPermission(
  permissions: string[],
  isSuperAdmin: boolean,
  code: string | null | undefined,
): boolean {
  if (!code) {
    return true;
  }
  if (isSuperAdmin) {
    return true;
  }
  return permissions.includes(code);
}

export function isAdminGatePermission(
  code: string,
): code is AdminGatePermission {
  return (ADMIN_GATE_PERMISSIONS as readonly string[]).includes(code);
}
