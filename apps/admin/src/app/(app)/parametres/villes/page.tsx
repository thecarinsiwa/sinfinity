import { CitiesPanel } from "@/components/settings/cities-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default function VillesPage() {
  return (
    <SettingsSubpage
      title="Villes"
      description="Villes rattachées aux pays du référentiel."
    >
      <CitiesPanel />
    </SettingsSubpage>
  );
}
