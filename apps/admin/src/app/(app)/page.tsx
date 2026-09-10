"use client";

import Link from "next/link";
import { Can } from "@/components/auth/can";
import { Badge } from "@/components/ui";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          Console d’administration
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Tableau de bord
        </h1>
        <p className="max-w-2xl text-muted">
          Paramétrage, organisation, utilisateurs et référentiels. Les modules
          métier restent sur Web et POS.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Can permission="organizations.read">
          <DashboardCard
            title="Organisation"
            href="/organisation"
            hint="Fiche tenant et agences"
          />
        </Can>
        <Can permission="users.read">
          <DashboardCard
            title="Utilisateurs & rôles"
            href="/utilisateurs"
            hint="Comptes et RBAC"
          />
        </Can>
        <Can permission="settings.read">
          <DashboardCard
            title="Paramètres"
            href="/parametres"
            hint="Référentiels globaux"
          />
        </Can>
        <DashboardCard
          title="Santé API"
          href="/system/health"
          hint="Diagnostic CORS / Nest"
        />
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  href,
  hint,
}: {
  title: string;
  href: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-medium text-foreground">{title}</h2>
        <Badge tone="primary">Accès</Badge>
      </div>
      <p className="text-sm text-muted">{hint}</p>
    </Link>
  );
}
