import { getTranslations } from "next-intl/server";
import { ProductsPanel } from "@/components/catalogue/products-panel";
import { CatalogueSubpage } from "@/components/catalogue/catalogue-subpage";

export default async function CatalogueProduitsPage() {
  const t = await getTranslations("catalogue");

  return (
    <CatalogueSubpage
      title={t("products.pageTitle")}
      description={t("products.pageLead")}
    >
      <ProductsPanel />
    </CatalogueSubpage>
  );
}
