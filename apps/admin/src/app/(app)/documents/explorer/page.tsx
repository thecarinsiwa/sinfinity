import { getTranslations } from "next-intl/server";
import { DocumentsBrowsePanel } from "@/components/documents/documents-browse-panel";
import { DocumentsSubpage } from "@/components/documents/documents-subpage";

export default async function DocumentsExplorerPage() {
  const t = await getTranslations("documents.browse");

  return (
    <DocumentsSubpage title={t("pageTitle")} description={t("pageLead")}>
      <DocumentsBrowsePanel />
    </DocumentsSubpage>
  );
}
