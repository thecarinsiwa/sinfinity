import { EmptyState } from "@/components/ui";
import { CatalogueSubpage } from "@/components/catalogue/catalogue-subpage";

export default function CatalogueCategoriesServicesPage() {
  return (
    <CatalogueSubpage
      title="Catégories services"
      description="Liste plate service-categories."
    >
      <EmptyState
        title="À venir"
        description="Le CRUD des catégories de services sera branché ensuite."
      />
    </CatalogueSubpage>
  );
}
