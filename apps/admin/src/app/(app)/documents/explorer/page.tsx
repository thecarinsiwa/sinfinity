import { DocumentsBrowsePanel } from "@/components/documents/documents-browse-panel";
import { DocumentsSubpage } from "@/components/documents/documents-subpage";

export default function DocumentsExplorerPage() {
  return (
    <DocumentsSubpage
      title="Explorer"
      description="Liste lecture seule pour support (filtres type / entité / statut)."
    >
      <DocumentsBrowsePanel />
    </DocumentsSubpage>
  );
}
