import { getTranslations } from "next-intl/server";
import { DocumentTypesPanel } from "@/components/documents/document-types-panel";
import { DocumentsSubpage } from "@/components/documents/documents-subpage";

export default async function DocumentTypesPage() {
  const t = await getTranslations("documents.types");

  return (
    <DocumentsSubpage title={t("pageTitle")} description={t("pageLead")}>
      <DocumentTypesPanel />
    </DocumentsSubpage>
  );
}
