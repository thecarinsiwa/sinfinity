import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LoginLogsPanel } from "@/components/audit/login-logs-panel";

export default async function AuditConnexionsPage() {
  const t = await getTranslations("audit");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm">
          <Link
            href="/audit"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("backToAudit")}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("loginPageTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("loginPageLead")}</p>
      </div>
      <LoginLogsPanel />
    </div>
  );
}
