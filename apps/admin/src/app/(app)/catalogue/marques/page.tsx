import { BrandsPanel } from "@/components/catalogue/brands-panel";
import { CatalogueSubpage } from "@/components/catalogue/catalogue-subpage";

export default function CatalogueMarquesPage() {
  return (
    <CatalogueSubpage
      title="Marques"
      description="Référentiel product-brands."
    >
      <BrandsPanel />
    </CatalogueSubpage>
  );
}
