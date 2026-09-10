/**
 * Getter synchrone optionnel pour le Bearer (tests / overrides).
 * En Server Components, `apiFetch` lit aussi le cookie httpOnly `sinfinity_access`.
 * En navigateur authentifié, le Bearer passe par `/api/backend` (cookies).
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
