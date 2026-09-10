"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  ErrorPageLink,
  ErrorPageShell,
} from "@/components/layout/error-page-shell";
import { Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.error");
  const tCommon = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorPageShell
      code={t("code")}
      title={t("title")}
      description={t("description")}
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={() => reset()}>
            {tCommon("retry")}
          </Button>
          <ErrorPageLink href="/" variant="secondary">
            {tCommon("dashboard")}
          </ErrorPageLink>
          <ErrorPageLink href="/login" variant="secondary">
            {tCommon("login")}
          </ErrorPageLink>
        </div>
      }
    />
  );
}
