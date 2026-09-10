import { getTranslations } from "next-intl/server";
import { CurrenciesPanel } from "@/components/settings/currencies-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default async function DevisesPage() {
  const t = await getTranslations("settings.currencies");

  return (
    <SettingsSubpage title={t("pageTitle")} description={t("pageLead")}>
      <CurrenciesPanel />
    </SettingsSubpage>
  );
}
