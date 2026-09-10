"use client";

import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui";

type ComingSoonPageProps = {
  title: string;
  description?: string;
};

export function ComingSoonPage({
  title,
  description,
}: ComingSoonPageProps) {
  const t = useTranslations("common");
  const tStubs = useTranslations("stubs");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      <EmptyState
        title={t("comingSoon")}
        description={description ?? tStubs("defaultDescription")}
      />
    </div>
  );
}
