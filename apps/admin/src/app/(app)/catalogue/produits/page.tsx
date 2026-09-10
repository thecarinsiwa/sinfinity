import { ProductsPanel } from "@/components/catalogue/products-panel";
import { CatalogueSubpage } from "@/components/catalogue/catalogue-subpage";

export default function CatalogueProduitsPage() {
  return (
    <CatalogueSubpage
      title="Produits"
      description="CRUD allégé : SKU, marque, catégorie, unité, statut. Specs / images → Web."
    >
      <ProductsPanel />
    </CatalogueSubpage>
  );
}
