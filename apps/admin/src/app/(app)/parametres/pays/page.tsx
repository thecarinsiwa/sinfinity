import { CountriesPanel } from "@/components/settings/countries-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default function PaysPage() {
  return (
    <SettingsSubpage
      title="Pays"
      description="Référentiel géographique ISO 3166."
    >
      <CountriesPanel />
    </SettingsSubpage>
  );
}
