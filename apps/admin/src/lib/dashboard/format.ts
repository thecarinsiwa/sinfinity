/** Message key under `topbar.*` for local hour (0–23). */
export function greetingKeyForHour(
  hour: number,
): "topbar.greetingMorning" | "topbar.greetingAfternoon" | "topbar.greetingEvening" {
  if (hour >= 5 && hour < 12) {
    return "topbar.greetingMorning";
  }
  if (hour >= 12 && hour < 18) {
    return "topbar.greetingAfternoon";
  }
  return "topbar.greetingEvening";
}

/** @deprecated Prefer greetingKeyForHour + useTranslations */
export function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return "Bonjour";
  }
  if (hour >= 12 && hour < 18) {
    return "Bon après-midi";
  }
  return "Bonsoir";
}

/** Format API DATETIME / ISO for display; empty → em dash. */
export function formatDateTime(
  value: string | null | undefined,
  locale = "fr",
): string {
  if (!value) {
    return "—";
  }
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** @deprecated Prefer formatDateTime(value, locale) */
export function formatDateTimeFr(value: string | null | undefined): string {
  return formatDateTime(value, "fr-FR");
}
