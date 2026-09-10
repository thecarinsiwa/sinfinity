import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SettingsSeedAction } from "@/components/settings/settings-seed-action";
import { Badge } from "@/components/ui";
import { SETTINGS_NAV_ITEMS } from "@/lib/settings";

export async function SettingsHub() {
  const t = await getTranslations("settings");
  const tc = await getTranslations("common");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("hubTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("hubLead")}</p>
      </div>

      <SettingsSeedAction />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-medium text-foreground">
                {t(`nav.${item.id}.title`)}
              </h2>
              <Badge tone="primary">{tc("open")}</Badge>
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
