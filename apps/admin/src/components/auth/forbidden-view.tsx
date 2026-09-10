"use client";

import { ForbiddenActions } from "@/components/auth/forbidden-actions";
import { ErrorPageShell } from "@/components/layout/error-page-shell";

export function ForbiddenView() {
  return (
    <ErrorPageShell
      code="403"
      title="Accès refusé"
      description="Votre compte est authentifié mais ne dispose pas des permissions nécessaires pour la console d’administration."
      action={<ForbiddenActions />}
    />
  );
}
