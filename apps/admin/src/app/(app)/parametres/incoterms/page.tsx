import { ShippingTermsPanel } from "@/components/settings/shipping-terms-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default function IncotermsPage() {
  return (
    <SettingsSubpage
      title="Incoterms"
      description="EXW, FOB, CIF, DDP et autres termes de livraison."
    >
      <ShippingTermsPanel />
    </SettingsSubpage>
  );
}
