import { ExchangeRatesPanel } from "@/components/settings/exchange-rates-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default function TauxChangePage() {
  return (
    <SettingsSubpage
      title="Taux de change"
      description="Historique des taux et lookup du dernier taux (decimal string)."
    >
      <ExchangeRatesPanel />
    </SettingsSubpage>
  );
}
