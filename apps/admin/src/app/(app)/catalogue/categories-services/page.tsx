import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui";
import { CatalogueSubpage } from "@/components/catalogue/catalogue-subpage";

export default async function CatalogueCategoriesServicesPage() {
  const t = await getTranslations("catalogue");
  const tCommon = await getTranslations("common");

  return (
    <CatalogueSubpage
      title={t("nav.serviceCategories.title")}
      description={t("nav.serviceCategories.description")}
    >
      <EmptyState
        title={tCommon("comingSoon")}
        description={t("serviceCategoriesStub")}
      />
    </CatalogueSubpage>
  );
}
