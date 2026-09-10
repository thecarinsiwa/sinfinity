import { EmptyState } from "@/components/ui";
import { DocumentsSubpage } from "@/components/documents/documents-subpage";

export default function DocumentsExplorerPage() {
  return (
    <DocumentsSubpage
      title="Explorer"
      description="Liste lecture seule pour support (filtres type / entité)."
    >
      <EmptyState
        title="À venir"
        description="L’exploration des documents sera branchée ensuite."
      />
    </DocumentsSubpage>
  );
}
