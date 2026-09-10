import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  ErrorPageLink,
  ErrorPageShell,
} from "@/components/layout/error-page-shell";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("errors.notFound");
  return { title: t("metaTitle") };
}

export default async function NotFoundPage() {
  const t = await getTranslations("errors.notFound");
  const tCommon = await getTranslations("common");

  return (
    <ErrorPageShell
      code="404"
      title={t("title")}
      description={t("description")}
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ErrorPageLink href="/">{tCommon("dashboard")}</ErrorPageLink>
          <ErrorPageLink href="/login" variant="secondary">
            {tCommon("login")}
          </ErrorPageLink>
        </div>
      }
    />
  );
}
