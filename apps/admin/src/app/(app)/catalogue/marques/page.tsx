import { getTranslations } from "next-intl/server";
import { BrandsPanel } from "@/components/catalogue/brands-panel";
import { CatalogueSubpage } from "@/components/catalogue/catalogue-subpage";

export default async function CatalogueMarquesPage() {
  const t = await getTranslations("catalogue");

  return (
    <CatalogueSubpage
      title={t("brands.pageTitle")}
      description={t("brands.pageLead")}
    >
      <BrandsPanel />
    </CatalogueSubpage>
  );
}
