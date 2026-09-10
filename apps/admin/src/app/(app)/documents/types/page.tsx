import { EmptyState } from "@/components/ui";
import { DocumentsSubpage } from "@/components/documents/documents-subpage";

export default function DocumentTypesPage() {
  return (
    <DocumentsSubpage
      title="Types documentaires"
      description="Catalogue code, nom, MIME autorisés."
    >
      <EmptyState
        title="À venir"
        description="Le CRUD des types documentaires sera branché ensuite."
      />
    </DocumentsSubpage>
  );
}
