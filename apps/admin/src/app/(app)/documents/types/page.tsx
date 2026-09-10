import { DocumentTypesPanel } from "@/components/documents/document-types-panel";
import { DocumentsSubpage } from "@/components/documents/documents-subpage";

export default function DocumentTypesPage() {
  return (
    <DocumentsSubpage
      title="Types documentaires"
      description="Catalogue code, nom, MIME autorisés (configuration)."
    >
      <DocumentTypesPanel />
    </DocumentsSubpage>
  );
}
