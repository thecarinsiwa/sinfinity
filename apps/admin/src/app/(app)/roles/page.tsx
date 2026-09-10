import { getTranslations } from "next-intl/server";
import { ComingSoonPage } from "@/components/layout/coming-soon";

export default async function RolesPage() {
  const t = await getTranslations("stubs");
  return <ComingSoonPage title={t("rolesTitle")} />;
}
