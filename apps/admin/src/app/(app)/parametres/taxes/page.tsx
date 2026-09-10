import { TaxesPanel } from "@/components/settings/taxes-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default function TaxesPage() {
  return (
    <SettingsSubpage
      title="Taxes"
      description="TVA, douane, retenues — taux en decimal string."
    >
      <TaxesPanel />
    </SettingsSubpage>
  );
}
