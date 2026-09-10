import { getTranslations } from "next-intl/server";
import { CountriesPanel } from "@/components/settings/countries-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default async function PaysPage() {
  const t = await getTranslations("settings.countries");

  return (
    <SettingsSubpage title={t("pageTitle")} description={t("pageLead")}>
      <CountriesPanel />
    </SettingsSubpage>
  );
}
