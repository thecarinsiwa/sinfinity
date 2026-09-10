import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForbiddenView } from "@/components/auth/forbidden-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("errors.forbidden");
  return { title: t("metaTitle") };
}

export default function ForbiddenPage() {
  return <ForbiddenView />;
}
