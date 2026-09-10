import { getTranslations } from "next-intl/server";
import { ShippingTermsPanel } from "@/components/settings/shipping-terms-panel";
import { SettingsSubpage } from "@/components/settings/settings-subpage";

export default async function IncotermsPage() {
  const t = await getTranslations("settings.shippingTerms");

  return (
    <SettingsSubpage title={t("pageTitle")} description={t("pageLead")}>
      <ShippingTermsPanel />
    </SettingsSubpage>
  );
}
