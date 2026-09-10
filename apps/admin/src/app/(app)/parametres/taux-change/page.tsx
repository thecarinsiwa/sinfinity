import { getTranslations } from "next-intl/server";
import { ExchangeRatesPanel } from "@/components/settings/exchange-rates-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default async function TauxChangePage() {
  const t = await getTranslations("settings.exchangeRates");

  return (
    <SettingsSubpage title={t("pageTitle")} description={t("pageLead")}>
      <ExchangeRatesPanel />
    </SettingsSubpage>
  );
}
