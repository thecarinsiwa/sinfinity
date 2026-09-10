/**
 * Stub d’injection Authorization (phase 1 : brancher la session JWT).
 * Par défaut aucun token n’est envoyé.
 */
export type AccessTokenGetter = () => string | null | undefined;

let accessTokenGetter: AccessTokenGetter = () => null;

export function setAccessTokenGetter(getter: AccessTokenGetter): void {
  accessTokenGetter = getter;
}

export function getAccessToken(): string | null {
  const token = accessTokenGetter();
  if (typeof token !== "string") {
    return null;
  }
  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : null;
}
