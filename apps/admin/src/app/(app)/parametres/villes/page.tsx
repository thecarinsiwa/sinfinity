import { getTranslations } from "next-intl/server";
import { CitiesPanel } from "@/components/settings/cities-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default async function VillesPage() {
  const t = await getTranslations("settings.cities");

  return (
    <SettingsSubpage title={t("pageTitle")} description={t("pageLead")}>
      <CitiesPanel />
    </SettingsSubpage>
  );
}
