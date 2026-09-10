import { getTranslations } from "next-intl/server";
import { PaymentTermsPanel } from "@/components/settings/payment-terms-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default async function ConditionsPaiementPage() {
  const t = await getTranslations("settings.paymentTerms");

  return (
    <SettingsSubpage title={t("pageTitle")} description={t("pageLead")}>
      <PaymentTermsPanel />
    </SettingsSubpage>
  );
}
