import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui";
import { CatalogueSubpage } from "@/components/catalogue/catalogue-subpage";

export default async function CatalogueCategoriesPage() {
  const t = await getTranslations("catalogue");
  const tCommon = await getTranslations("common");

  return (
    <CatalogueSubpage
      title={t("nav.categories.title")}
      description={t("nav.categories.description")}
    >
      <EmptyState
        title={tCommon("comingSoon")}
        description={t("categoriesStub")}
      />
    </CatalogueSubpage>
  );
}
