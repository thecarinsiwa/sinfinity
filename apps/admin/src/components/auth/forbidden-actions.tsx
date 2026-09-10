"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { useAuth } from "@/components/auth/auth-provider";

export function ForbiddenActions() {
  const t = useTranslations("errors.forbidden");
  const tCommon = useTranslations("common");
  const { logout, status } = useAuth();

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button
        type="button"
        onClick={() => void logout()}
        disabled={status === "loading"}
      >
        {t("logout")}
      </Button>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-muted"
      >
        {tCommon("dashboard")}
      </Link>
      <Link
        href="/system/health"
        className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-muted"
      >
        {tCommon("apiHealth")}
      </Link>
    </div>
  );
}
