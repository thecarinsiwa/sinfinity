import { getTranslations } from "next-intl/server";
import { BranchesPanel } from "@/components/organisation/branches-panel";

export default async function AgencesPage() {
  const t = await getTranslations("organisation");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("branchesPageTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("branchesPageLead")}</p>
      </div>
      <BranchesPanel />
    </div>
  );
}
