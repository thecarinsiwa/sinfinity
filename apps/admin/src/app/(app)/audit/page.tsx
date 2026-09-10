import { AuditLogsPanel } from "@/components/audit/audit-logs-panel";

export default function AuditPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Audit
        </h1>
        <p className="mt-1 text-sm text-muted">
          Historique append-only des mutations (lecture seule).
        </p>
      </div>
      <AuditLogsPanel />
    </div>
  );
}
