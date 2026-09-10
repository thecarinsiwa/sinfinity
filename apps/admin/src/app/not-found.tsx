import type { Metadata } from "next";
import {
  ErrorPageLink,
  ErrorPageShell,
} from "@/components/layout/error-page-shell";

export const metadata: Metadata = {
  title: "Page introuvable — Sinfinity Admin",
};

export default function NotFoundPage() {
  return (
    <ErrorPageShell
      code="404"
      title="Page introuvable"
      description="Cette adresse n’existe pas ou a été déplacée. Retournez au tableau de bord ou reconnectez-vous."
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ErrorPageLink href="/">Tableau de bord</ErrorPageLink>
          <ErrorPageLink href="/login" variant="secondary">
            Connexion
          </ErrorPageLink>
        </div>
      }
    />
  );
}
