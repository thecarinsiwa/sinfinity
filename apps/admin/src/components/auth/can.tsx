"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { canAccessPermission } from "@/lib/auth/admin-access";

type CanProps = {
  permission: string;
  children: ReactNode;
  /** Contenu affiché si la permission manque (défaut : rien). */
  fallback?: ReactNode;
};

/**
 * Affiche les enfants seulement si l’utilisateur a la permission
 * (ou isSuperAdmin).
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { permissions, isSuperAdmin, status } = useAuth();

  if (status !== "authenticated") {
    return <>{fallback}</>;
  }

  if (!canAccessPermission(permissions, isSuperAdmin, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
