"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, type AppLocale } from "@/i18n/config";
import { setLocaleAction } from "@/i18n/set-locale";
import { cn } from "@/lib/cn";

type LocaleSwitcherProps = {
  className?: string;
  /** Compact select for topbar; larger for login */
  size?: "sm" | "md";
};

export function LocaleSwitcher({
  className,
  size = "sm",
}: LocaleSwitcherProps) {
  const t = useTranslations("locale");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    if (!locales.includes(next as AppLocale) || next === locale) {
      return;
    }
    startTransition(async () => {
      await setLocaleAction(next as AppLocale);
      router.refresh();
    });
  }

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 text-sm",
        size === "sm" ? "text-muted" : "text-neutral-500",
        className,
      )}
    >
      <span className="sr-only">{t("label")}</span>
      <select
        aria-label={t("label")}
        value={locale}
        disabled={pending}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "rounded-md border border-border bg-surface text-foreground outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary/40",
          "disabled:cursor-wait disabled:opacity-60",
          size === "sm"
            ? "h-9 px-2 text-xs"
            : "h-10 border-neutral-300 bg-white/90 px-3 text-sm",
        )}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
