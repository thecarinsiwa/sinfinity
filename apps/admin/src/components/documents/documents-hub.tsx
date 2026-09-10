import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui";
import { DOCUMENTS_NAV_ITEMS } from "@/lib/documents";

export async function DocumentsHub() {
  const t = await getTranslations("documents");
  const tCommon = await getTranslations("common");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("hubTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("hubLead")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {DOCUMENTS_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-medium text-foreground">
                {t(`nav.${item.id}.title`)}
              </h2>
              <Badge tone="primary">{tCommon("open")}</Badge>
            </div>
            <p className="text-sm text-muted">
              {t(`nav.${item.id}.description`)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
