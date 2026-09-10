import { UnitsPanel } from "@/components/settings/units-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default function UnitesPage() {
  return (
    <SettingsSubpage
      title="Unités"
      description="PCS, KG, BOX et autres unités de mesure."
    >
      <UnitsPanel />
    </SettingsSubpage>
  );
}
