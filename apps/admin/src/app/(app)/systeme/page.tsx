import { getTranslations } from "next-intl/server";
import { SystemSettingsPanel } from "@/components/systeme/system-settings-panel";

export default async function SystemePage() {
  const t = await getTranslations("systeme");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("pageLead")}</p>
      </div>
      <SystemSettingsPanel />
    </div>
  );
}
