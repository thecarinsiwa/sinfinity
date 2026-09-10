import { SYSTEM_SETTING_KEY_REGEX } from "./types";

export type JsonParseSuccess = {
  ok: true;
  value: unknown;
};

export type JsonParseFailure = {
  ok: false;
  error: string;
};

export type JsonParseResult = JsonParseSuccess | JsonParseFailure;

/**
 * Parse JSON côté client pour l’éditeur system-settings.
 * Ne lève pas — retourne un résultat discriminé.
 */
export function parseJsonSafe(text: string): JsonParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: "Le JSON est vide" };
  }
  try {
    return { ok: true, value: JSON.parse(trimmed) as unknown };
  } catch (cause) {
    const message =
      cause instanceof SyntaxError
        ? cause.message
        : "JSON invalide";
    return { ok: false, error: message };
  }
}

/**
 * Pretty-print pour Textarea. Chaînes déjà JSON restent lisibles ;
 * valeurs non sérialisables → fallback string.
 */
export function stringifyJsonPretty(value: unknown, space = 2): string {
  if (typeof value === "string") {
    const parsed = parseJsonSafe(value);
    if (parsed.ok) {
      try {
        return JSON.stringify(parsed.value, null, space);
      } catch {
        return value;
      }
    }
    return value;
  }
  try {
    return JSON.stringify(value, null, space);
  } catch {
    return String(value);
  }
}

export function isSystemSettingKey(key: string): boolean {
  return SYSTEM_SETTING_KEY_REGEX.test(key.trim());
}
