import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Alert, Badge } from "@/components/ui";
import { ApiError, apiFetch, getApiBaseUrl, type HealthResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

type HealthLoadResult =
  | { ok: true; data: HealthResponse }
  | { ok: false; message: string; statusCode?: number };

async function loadHealth(
  unreachableFallback: string,
): Promise<HealthLoadResult> {
  try {
    const data = await apiFetch<HealthResponse>("/health", {
      cache: "no-store",
      skipAuth: true,
    });
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        ok: false,
        message: error.message,
        statusCode: error.statusCode || undefined,
      };
    }
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : unreachableFallback,
    };
  }
}

export default async function SystemHealthPage() {
  const t = await getTranslations("health");
  const tSysteme = await getTranslations("systeme");
  const result = await loadHealth(t("unreachable"));
  const baseUrl = getApiBaseUrl();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          {tSysteme("pageTitle")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted">
          {t("lead")}{" "}
          <code className="font-mono text-foreground">{baseUrl}</code>
        </p>
      </div>

      {result.ok ? (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <dt className="text-muted">{t("apiStatus")}</dt>
              <dd>
                <Badge tone="success">{result.data.status}</Badge>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted">{t("database")}</dt>
              <dd>
                <Badge tone="success">{result.data.database}</Badge>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted">{t("version")}</dt>
              <dd className="font-mono text-foreground">{result.data.version}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <Alert tone="danger" title={t("unreachable")}>
          {result.statusCode ? (
            <p className="mb-1">HTTP {result.statusCode}</p>
          ) : null}
          <p>{result.message}</p>
        </Alert>
      )}

      <p className="text-sm">
        <Link
          href="/"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("backHome")}
        </Link>
      </p>
    </div>
  );
}
