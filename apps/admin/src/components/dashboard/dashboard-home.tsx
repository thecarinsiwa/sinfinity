"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge, Spinner } from "@/components/ui";
import {
  ApiError,
  apiFetch,
  type HealthResponse,
  type PaginatedResponse,
} from "@/lib/api";
import { formatDateTimeFr } from "@/lib/dashboard/format";
import { cn } from "@/lib/cn";

type CountState =
  | { status: "loading" }
  | { status: "ready"; total: number }
  | { status: "denied" }
  | { status: "error"; message: string };

type HealthState =
  | { status: "loading" }
  | { status: "ready"; data: HealthResponse }
  | { status: "error"; message: string };

const QUICK_LINKS: Array<{
  title: string;
  href: string;
  hint: string;
  permission: string | null;
}> = [
  {
    title: "Organisation",
    href: "/organisation",
    hint: "Fiche tenant",
    permission: "organizations.read",
  },
  {
    title: "Agences",
    href: "/organisation/agences",
    hint: "Sites & entrepôts",
    permission: "branches.read",
  },
  {
    title: "Utilisateurs",
    href: "/utilisateurs",
    hint: "Comptes",
    permission: "users.read",
  },
  {
    title: "Rôles",
    href: "/roles",
    hint: "RBAC",
    permission: "roles.read",
  },
  {
    title: "Paramètres",
    href: "/parametres",
    hint: "Référentiels",
    permission: "settings.read",
  },
  {
    title: "Audit",
    href: "/audit",
    hint: "Journal",
    permission: "audit.read",
  },
  {
    title: "Santé API",
    href: "/system/health",
    hint: "Diagnostic",
    permission: null,
  },
];

export function DashboardHome() {
  const { user, organization, hasPermission, isSuperAdmin } = useAuth();
  const [usersCount, setUsersCount] = useState<CountState>({
    status: "loading",
  });
  const [branchesCount, setBranchesCount] = useState<CountState>({
    status: "loading",
  });
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadCount(
      path: string,
      allowed: boolean,
      setState: (value: CountState) => void,
    ) {
      if (!allowed) {
        setState({ status: "denied" });
        return;
      }
      try {
        const result = await apiFetch<PaginatedResponse<unknown>>(path);
        if (!cancelled) {
          setState({ status: "ready", total: result.meta.total });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof ApiError
                ? error.message
                : "Chargement impossible",
          });
        }
      }
    }

    async function loadHealth() {
      try {
        const data = await apiFetch<HealthResponse>("/health", {
          skipAuth: true,
          cache: "no-store",
        });
        if (!cancelled) {
          setHealth({ status: "ready", data });
        }
      } catch (error) {
        if (!cancelled) {
          setHealth({
            status: "error",
            message:
              error instanceof ApiError ? error.message : "API injoignable",
          });
        }
      }
    }

    void loadCount(
      "/users?page=1&pageSize=1&isActive=true",
      isSuperAdmin || hasPermission("users.read"),
      setUsersCount,
    );
    void loadCount(
      "/branches?page=1&pageSize=1&isActive=true",
      isSuperAdmin || hasPermission("branches.read"),
      setBranchesCount,
    );
    void loadHealth();

    return () => {
      cancelled = true;
    };
  }, [hasPermission, isSuperAdmin]);

  return (
    <div className="flex flex-col gap-6 pb-2">
      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-4" delay={0}>
          <p className="text-sm font-medium text-muted">Organisation</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {organization?.name ?? "—"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Console d’administration Sinfinity. Les modules métier restent sur
            Web et POS.
          </p>
          <Can permission="organizations.read">
            <Link
              href="/organisation"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Ouvrir la fiche
            </Link>
          </Can>
        </Panel>

        <Panel className="lg:col-span-8" delay={60}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted">Vue d’ensemble</p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Indicateurs
              </h2>
            </div>
            <Badge tone="neutral">Lectures API</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Utilisateurs actifs"
              href="/utilisateurs"
              state={usersCount}
            />
            <StatTile
              label="Agences actives"
              href="/organisation/agences"
              state={branchesCount}
            />
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-sm text-muted">Dernière connexion</p>
              <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                {formatDateTimeFr(user?.lastLoginAt)}
              </p>
              <p className="mt-2 truncate text-xs text-muted">{user?.email}</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel delay={120}>
        <div className="mb-4">
          <p className="text-sm font-medium text-muted">Raccourcis</p>
          <h2 className="text-lg font-semibold text-foreground">
            Accès rapides
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {QUICK_LINKS.map((link) => {
            const card = (
              <Link
                href={link.href}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-border/70 bg-background/50 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-surface text-primary shadow-sm ring-1 ring-border/60 transition-transform group-hover:scale-105">
                  <QuickLinkGlyph label={link.title} />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {link.title}
                </span>
                <span className="text-xs text-muted">{link.hint}</span>
              </Link>
            );

            if (!link.permission) {
              return <div key={link.href}>{card}</div>;
            }

            return (
              <Can key={link.href} permission={link.permission}>
                {card}
              </Can>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-5" delay={180}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted">Santé API</p>
              <h2 className="text-lg font-semibold text-foreground">
                Disponibilité Nest
              </h2>
            </div>
            {health.status === "ready" ? (
              <Badge tone="success">UP</Badge>
            ) : health.status === "error" ? (
              <Badge tone="danger">DOWN</Badge>
            ) : (
              <Badge tone="neutral">…</Badge>
            )}
          </div>

          <div className="mt-6 flex items-center gap-6">
            <HealthRing state={health} />
            <div className="min-w-0 flex-1 space-y-2 text-sm">
              {health.status === "loading" ? (
                <Spinner label="Contrôle en cours…" />
              ) : null}
              {health.status === "ready" ? (
                <>
                  <Row label="API" value={health.data.status} />
                  <Row label="Base" value={health.data.database} />
                  <Row label="Version" value={health.data.version} />
                </>
              ) : null}
              {health.status === "error" ? (
                <p className="text-danger">{health.message}</p>
              ) : null}
              <Link
                href="/system/health"
                className="inline-flex pt-2 text-sm font-medium text-primary hover:underline"
              >
                Voir le détail
              </Link>
            </div>
          </div>
        </Panel>

        <Panel className="lg:col-span-7" delay={220}>
          <p className="text-sm font-medium text-muted">Session</p>
          <h2 className="text-lg font-semibold text-foreground">
            Profil courant
          </h2>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoCell
              label="Nom"
              value={
                [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                "—"
              }
            />
            <InfoCell label="Email" value={user?.email ?? "—"} />
            <InfoCell
              label="Rôle plateforme"
              value={isSuperAdmin ? "Super-admin" : "Utilisateur org"}
            />
            <InfoCell
              label="Permissions"
              value={`${user?.permissions?.length ?? 0} code(s)`}
            />
          </dl>
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-xl)] border border-border/70 bg-surface p-5 shadow-[var(--shadow-md)]",
        className,
      )}
      style={{
        animation: `dash-rise 0.5s ease-out ${delay}ms both`,
      }}
    >
      {children}
    </section>
  );
}

function StatTile({
  label,
  href,
  state,
}: {
  label: string;
  href: string;
  state: CountState;
}) {
  const content = (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4 transition-colors hover:border-primary/35">
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-3 min-h-8">
        {state.status === "loading" ? <Spinner className="text-xs" /> : null}
        {state.status === "ready" ? (
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {state.total}
          </p>
        ) : null}
        {state.status === "denied" ? (
          <p className="text-sm text-muted">Permission requise</p>
        ) : null}
        {state.status === "error" ? (
          <p className="text-sm text-danger">{state.message}</p>
        ) : null}
      </div>
    </div>
  );

  if (state.status === "denied") {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}

function HealthRing({ state }: { state: HealthState }) {
  const ok = state.status === "ready";
  const bad = state.status === "error";
  return (
    <div
      className={cn(
        "relative flex size-28 shrink-0 items-center justify-center rounded-full border-[10px]",
        ok ? "border-success/30" : bad ? "border-danger/30" : "border-border",
      )}
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full border-[10px] border-transparent",
          ok ? "border-t-success border-r-success" : null,
          bad ? "border-t-danger" : null,
        )}
      />
      <span
        className={cn(
          "text-sm font-semibold",
          ok ? "text-success" : bad ? "text-danger" : "text-muted",
        )}
      >
        {ok ? "OK" : bad ? "KO" : "…"}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground uppercase">{value}</span>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function QuickLinkGlyph({ label }: { label: string }) {
  const letter = label.trim().charAt(0).toUpperCase() || "?";
  return <span className="text-sm font-bold">{letter}</span>;
}
