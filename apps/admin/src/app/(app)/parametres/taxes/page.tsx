import { getTranslations } from "next-intl/server";
import { TaxesPanel } from "@/components/settings/taxes-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default async function TaxesPage() {
  const t = await getTranslations("settings.taxes");

  return (
    <SettingsSubpage title={t("pageTitle")} description={t("pageLead")}>
      <TaxesPanel />
    </SettingsSubpage>
  );
}
