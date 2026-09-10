import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";

export { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";

const IS_PROD = process.env.NODE_ENV === "production";

/** Access token TTL default (15m) — aligné JWT_ACCESS_TTL API. */
const ACCESS_MAX_AGE_SECONDS = 60 * 15;
/** Refresh token TTL default (7d) — aligné JWT_REFRESH_TTL API. */
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function baseCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function getAuthCookies(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const jar = await cookies();
  return {
    accessToken: jar.get(ACCESS_COOKIE)?.value ?? null,
    refreshToken: jar.get(REFRESH_COOKIE)?.value ?? null,
  };
}

export function setAuthCookies(
  jar: CookieStore,
  tokens: { accessToken: string; refreshToken: string; expiresIn?: number },
): void {
  const accessMaxAge =
    typeof tokens.expiresIn === "number" && tokens.expiresIn > 0
      ? tokens.expiresIn
      : ACCESS_MAX_AGE_SECONDS;

  jar.set(ACCESS_COOKIE, tokens.accessToken, baseCookieOptions(accessMaxAge));
  jar.set(
    REFRESH_COOKIE,
    tokens.refreshToken,
    baseCookieOptions(REFRESH_MAX_AGE_SECONDS),
  );
}

export function clearAuthCookies(jar: CookieStore): void {
  jar.set(ACCESS_COOKIE, "", { ...baseCookieOptions(0), maxAge: 0 });
  jar.set(REFRESH_COOKIE, "", { ...baseCookieOptions(0), maxAge: 0 });
}

export function hasAuthCookieHeader(cookieHeader: string | null): boolean {
  if (!cookieHeader) {
    return false;
  }
  return (
    cookieHeader.includes(`${ACCESS_COOKIE}=`) ||
    cookieHeader.includes(`${REFRESH_COOKIE}=`)
  );
}
