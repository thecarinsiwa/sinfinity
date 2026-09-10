import { EmptyState } from "@/components/ui";
import { CatalogueSubpage } from "@/components/catalogue/catalogue-subpage";

export default function CatalogueMarquesPage() {
  return (
    <CatalogueSubpage
      title="Marques"
      description="Référentiel product-brands."
    >
      <EmptyState
        title="À venir"
        description="Le CRUD des marques sera branché ensuite."
      />
    </CatalogueSubpage>
  );
}
