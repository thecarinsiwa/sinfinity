"use client";

import { useEffect } from "react";
import {
  ErrorPageLink,
  ErrorPageShell,
} from "@/components/layout/error-page-shell";
import { Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorPageShell
      code="Erreur"
      title="Une erreur est survenue"
      description="Un problème inattendu a bloqué cet écran. Vous pouvez réessayer ou revenir au tableau de bord."
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={() => reset()}>
            Réessayer
          </Button>
          <ErrorPageLink href="/" variant="secondary">
            Tableau de bord
          </ErrorPageLink>
          <ErrorPageLink href="/login" variant="secondary">
            Connexion
          </ErrorPageLink>
        </div>
      }
    />
  );
}
