import { getTranslations } from "next-intl/server";
import { UnitsPanel } from "@/components/settings/units-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default async function UnitesPage() {
  const t = await getTranslations("settings.units");

  return (
    <SettingsSubpage title={t("pageTitle")} description={t("pageLead")}>
      <UnitsPanel />
    </SettingsSubpage>
  );
}
