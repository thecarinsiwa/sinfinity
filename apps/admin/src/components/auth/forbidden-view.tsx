"use client";

import { useTranslations } from "next-intl";
import { ForbiddenActions } from "@/components/auth/forbidden-actions";
import { ErrorPageShell } from "@/components/layout/error-page-shell";

export function ForbiddenView() {
  const t = useTranslations("errors.forbidden");

  return (
    <ErrorPageShell
      code="403"
      title={t("title")}
      description={t("description")}
      action={<ForbiddenActions />}
    />
  );
}
