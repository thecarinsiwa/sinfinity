"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Can } from "@/components/auth/can";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge, Button, Spinner } from "@/components/ui";
import {
  ApiError,
  apiFetch,
  type HealthResponse,
  type PaginatedResponse,
} from "@/lib/api";
import { formatDateTime, greetingKeyForHour } from "@/lib/dashboard/format";
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

type QuickLinkId =
  | "organization"
  | "users"
  | "settings"
  | "audit"
  | "branches"
  | "roles"
  | "health";

const QUICK_LINKS: Array<{
  id: QuickLinkId;
  href: string;
  permission: string | null;
}> = [
  {
    id: "organization",
    href: "/organisation",
    permission: "organizations.read",
  },
  { id: "users", href: "/utilisateurs", permission: "users.read" },
  { id: "settings", href: "/parametres", permission: "settings.read" },
  { id: "audit", href: "/audit", permission: "audit.read" },
  {
    id: "branches",
    href: "/organisation/agences",
    permission: "branches.read",
  },
  { id: "roles", href: "/roles", permission: "roles.read" },
  { id: "health", href: "/system/health", permission: null },
];

export function DashboardHome() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tRoot = useTranslations();
  const locale = useLocale();
  const { user, organization, hasPermission, isSuperAdmin } = useAuth();
  const [usersCount, setUsersCount] = useState<CountState>({
    status: "loading",
  });
  const [branchesCount, setBranchesCount] = useState<CountState>({
    status: "loading",
  });
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

  const loadHealth = useCallback(
    async (signal?: { cancelled: boolean }) => {
      setHealth({ status: "loading" });
      try {
        const data = await apiFetch<HealthResponse>("/health", {
          skipAuth: true,
          cache: "no-store",
        });
        if (!signal?.cancelled) {
          setHealth({ status: "ready", data });
        }
      } catch (error) {
        if (!signal?.cancelled) {
          setHealth({
            status: "error",
            message:
              error instanceof ApiError
                ? error.message
                : t("healthUnreachable"),
          });
        }
      }
    },
    [t],
  );

  useEffect(() => {
    const signal = { cancelled: false };

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
        if (!signal.cancelled) {
          setState({ status: "ready", total: result.meta.total });
        }
      } catch (error) {
        if (signal.cancelled) return;
        if (error instanceof ApiError && error.statusCode === 403) {
          setState({ status: "denied" });
          return;
        }
        setState({
          status: "error",
          message:
            error instanceof ApiError ? error.message : t("loadFailed"),
        });
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
    void loadHealth(signal);

    return () => {
      signal.cancelled = true;
    };
  }, [hasPermission, isSuperAdmin, loadHealth, t]);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "";
  const greeting = tRoot(greetingKeyForHour(new Date().getHours()));

  return (
    <div className="flex flex-col gap-6 pb-2">
      <header>
        <p className="text-sm text-muted">
          {greeting}
          {displayName ? (
            <>
              ,{" "}
              <span className="font-medium text-foreground">{displayName}</span>
            </>
          ) : null}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("lead")}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-4" delay={0}>
          <p className="text-sm font-medium text-muted">
            {t("organizationLabel")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {organization?.name ?? tCommon("emDash")}
          </h2>
          <p className="mt-2 text-sm text-muted">{t("organizationBlurb")}</p>
          <Can permission="organizations.read">
            <Link
              href="/organisation"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {t("openOrg")}
            </Link>
          </Can>
        </Panel>

        <Panel className="lg:col-span-8" delay={60}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted">
                {t("overviewLabel")}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("indicators")}
              </h2>
            </div>
            <Badge tone="neutral">{t("apiReads")}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label={t("activeUsers")}
              href="/utilisateurs"
              state={usersCount}
              permissionRequired={t("permissionRequired")}
              openListLabel={t("openList", { label: t("activeUsers") })}
            />
            <StatTile
              label={t("activeBranches")}
              href="/organisation/agences"
              state={branchesCount}
              permissionRequired={t("permissionRequired")}
              openListLabel={t("openList", { label: t("activeBranches") })}
            />
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <p className="text-sm text-muted">{t("lastLogin")}</p>
              <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                {formatDateTime(user?.lastLoginAt, locale)}
              </p>
              <p className="mt-2 truncate text-xs text-muted">{user?.email}</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel delay={120}>
        <div className="mb-4">
          <p className="text-sm font-medium text-muted">{t("shortcutsLabel")}</p>
          <h2 className="text-lg font-semibold text-foreground">
            {t("quickAccess")}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {QUICK_LINKS.map((link) => {
            const title = t(`links.${link.id}.title`);
            const hint = t(`links.${link.id}.hint`);
            const card = (
              <Link
                href={link.href}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-border/70 bg-background/50 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-surface text-primary shadow-sm ring-1 ring-border/60 transition-transform group-hover:scale-105">
                  <QuickLinkGlyph label={title} />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {title}
                </span>
                <span className="text-xs text-muted">{hint}</span>
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
              <p className="text-sm font-medium text-muted">{t("healthLabel")}</p>
              <h2 className="text-lg font-semibold text-foreground">
                {t("nestAvailability")}
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
            <div className="min-h-0 flex-1 space-y-2 text-sm">
              {health.status === "loading" ? (
                <Spinner label={t("healthChecking")} />
              ) : null}
              {health.status === "ready" ? (
                <>
                  <Row label="API" value={health.data.status} />
                  <Row label="Base" value={health.data.database} />
                  <Row label="Version" value={health.data.version} />
                </>
              ) : null}
              {health.status === "error" ? (
                <div className="space-y-3">
                  <p className="text-danger">{health.message}</p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void loadHealth()}
                  >
                    {t("retryHealth")}
                  </Button>
                </div>
              ) : null}
              <Link
                href="/system/health"
                className="inline-flex pt-2 text-sm font-medium text-primary hover:underline"
              >
                {t("viewDetail")}
              </Link>
            </div>
          </div>
        </Panel>

        <Panel className="lg:col-span-7" delay={220}>
          <p className="text-sm font-medium text-muted">{t("sessionLabel")}</p>
          <h2 className="text-lg font-semibold text-foreground">
            {t("currentProfile")}
          </h2>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoCell
              label={t("name")}
              value={
                [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                tCommon("emDash")
              }
            />
            <InfoCell
              label={t("email")}
              value={user?.email ?? tCommon("emDash")}
            />
            <InfoCell
              label={t("platformRole")}
              value={
                isSuperAdmin ? t("superAdminRole") : t("orgUserRole")
              }
            />
            <InfoCell
              label={t("permissions")}
              value={t("permissionCodes", {
                count: user?.permissions?.length ?? 0,
              })}
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
  permissionRequired,
  openListLabel,
}: {
  label: string;
  href: string;
  state: CountState;
  permissionRequired: string;
  openListLabel: string;
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
          <p className="text-sm text-muted">{permissionRequired}</p>
        ) : null}
        {state.status === "error" ? (
          <p className="text-sm text-danger">{state.message}</p>
        ) : null}
      </div>
    </div>
  );

  if (state.status === "denied" || state.status === "error") {
    return content;
  }

  return (
    <Link href={href} aria-label={openListLabel}>
      {content}
    </Link>
  );
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

