/**
 * Affiche un DECIMAL API (string) sans conversion float.
 * Garde la chaîne telle quelle après trim ; retourne "—" si vide.
 */
export function formatDecimalDisplay(value: string | null | undefined): string {
  if (value == null) {
    return "—";
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "—";
}

/** Regex alignée API CreateExchangeRateDto / CreateTaxDto. */
export const DECIMAL_STRING_REGEX = /^-?\d+(\.\d+)?$/;

export function isDecimalString(value: string): boolean {
  return DECIMAL_STRING_REGEX.test(value.trim());
}
