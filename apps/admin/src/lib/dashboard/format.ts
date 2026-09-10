/** French day-part greeting from local hour (0–23). */
export function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return "Bonjour";
  }
  if (hour >= 12 && hour < 18) {
    return "Bon après-midi";
  }
  return "Bonsoir";
}

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Format API DATETIME / ISO for display; empty → em dash. */
export function formatDateTimeFr(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateTimeFormatter.format(date);
}
