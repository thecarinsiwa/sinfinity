import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuditLogsPanel } from "@/components/audit/audit-logs-panel";

export default async function AuditPage() {
  const t = await getTranslations("audit");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("pageLead")}</p>
        </div>
        <Link
          href="/audit/connexions"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("loginLogsLink")}
        </Link>
      </div>
      <AuditLogsPanel />
    </div>
  );
}
