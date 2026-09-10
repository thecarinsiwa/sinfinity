import Link from "next/link";
import { Alert, Badge } from "@/components/ui";
import { ApiError, apiFetch, getApiBaseUrl, type HealthResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

type HealthLoadResult =
  | { ok: true; data: HealthResponse }
  | { ok: false; message: string; statusCode?: number };

async function loadHealth(): Promise<HealthLoadResult> {
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
        error instanceof Error ? error.message : "Impossible de joindre l’API",
    };
  }
}

export default async function SystemHealthPage() {
  const result = await loadHealth();
  const baseUrl = getApiBaseUrl();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          Système
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Santé de l’API
        </h1>
        <p className="text-sm text-muted">
          Contrôle public <code className="font-mono text-foreground">GET /health</code>{" "}
          via <code className="font-mono text-foreground">{baseUrl}</code>
        </p>
      </div>

      {result.ok ? (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
          <Alert tone="success" title="API joignable">
            Le client HTTP Admin atteint Nest et MySQL répond.
          </Alert>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <dt className="text-muted">Statut API</dt>
              <dd>
                <Badge tone="success">{result.data.status}</Badge>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted">Base de données</dt>
              <dd>
                <Badge tone="success">{result.data.database}</Badge>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted">Version</dt>
              <dd className="font-mono text-foreground">{result.data.version}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <Alert tone="danger" title="API indisponible">
          {result.statusCode ? (
            <p className="mb-1">HTTP {result.statusCode}</p>
          ) : null}
          <p>{result.message}</p>
          <p className="mt-2">
            Vérifiez que l’API tourne sur le port 4000 et que CORS autorise
            localhost:3001.
          </p>
        </Alert>
      )}

      <p className="text-sm">
        <Link
          href="/"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Retour à l’accueil
        </Link>
      </p>
    </div>
  );
}
