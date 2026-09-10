import Link from "next/link";
import { LoginLogsPanel } from "@/components/audit/login-logs-panel";

export default function AuditConnexionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm">
          <Link
            href="/audit"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            ← Audit
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Connexions
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tentatives de connexion (succès / échec) — lecture seule.
        </p>
      </div>
      <LoginLogsPanel />
    </div>
  );
}
