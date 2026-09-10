import type { Metadata } from "next";
import { ForbiddenActions } from "@/components/auth/forbidden-actions";
import { Alert } from "@/components/ui";

export const metadata: Metadata = {
  title: "Accès refusé — Sinfinity Admin",
};

export default function ForbiddenPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
      <main className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-sm">
        <p className="mb-2 text-sm font-medium tracking-wide text-primary uppercase">
          Sinfinity Admin
        </p>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
          Accès refusé
        </h1>
        <Alert tone="warning" title="Droits insuffisants">
          Votre compte est authentifié mais ne dispose pas des permissions
          nécessaires pour la console d’administration.
        </Alert>
        <ForbiddenActions />
      </main>
    </div>
  );
}
