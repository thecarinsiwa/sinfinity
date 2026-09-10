import Link from "next/link";
import { AuditLogsPanel } from "@/components/audit/audit-logs-panel";

export default function AuditPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Audit
          </h1>
          <p className="mt-1 text-sm text-muted">
            Historique append-only des mutations (lecture seule).
          </p>
        </div>
        <Link
          href="/audit/connexions"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Journaux de connexion →
        </Link>
      </div>
      <AuditLogsPanel />
    </div>
  );
}
