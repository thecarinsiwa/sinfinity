import { PaymentTermsPanel } from "@/components/settings/payment-terms-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default function ConditionsPaiementPage() {
  return (
    <SettingsSubpage
      title="Conditions de paiement"
      description="NET30, acompte et autres délais de règlement."
    >
      <PaymentTermsPanel />
    </SettingsSubpage>
  );
}
