import { EmptyState } from "@/components/ui";
import { CatalogueSubpage } from "@/components/catalogue/catalogue-subpage";

export default function CatalogueProduitsPage() {
  return (
    <CatalogueSubpage
      title="Produits"
      description="CRUD allégé : SKU, marque, catégorie, unité, statut."
    >
      <EmptyState
        title="À venir"
        description="Le CRUD produit allégé sera branché ensuite."
      />
    </CatalogueSubpage>
  );
}
