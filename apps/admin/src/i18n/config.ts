export const locales = ["fr", "en", "es"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "fr";

/** Cookie persistant pour la locale UI (chrome Admin uniquement). */
export const LOCALE_COOKIE = "sinfinity_locale";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 an

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value != null && (locales as readonly string[]).includes(value);
}
