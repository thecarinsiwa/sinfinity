import { EmptyState } from "@/components/ui";
import { CatalogueSubpage } from "@/components/catalogue/catalogue-subpage";

export default function CatalogueCategoriesPage() {
  return (
    <CatalogueSubpage
      title="Catégories produits"
      description="Arbre product-categories (parent_id)."
    >
      <EmptyState
        title="À venir"
        description="Le CRUD arborescent des catégories produits sera branché ensuite."
      />
    </CatalogueSubpage>
  );
}
