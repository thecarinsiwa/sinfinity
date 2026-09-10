import { CurrenciesPanel } from "@/components/settings/currencies-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default function DevisesPage() {
  return (
    <SettingsSubpage
      title="Devises"
      description="Référentiel monétaire (USD, CDF, CNY…)."
    >
      <CurrenciesPanel />
    </SettingsSubpage>
  );
}
