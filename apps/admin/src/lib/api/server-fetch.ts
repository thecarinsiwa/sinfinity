import "server-only";

import { getAuthCookies } from "@/lib/auth/cookies";
import { refreshAuthTokens } from "@/lib/auth/session";
import { apiFetch, type ApiFetchOptions } from "@/lib/api/client";

/**
 * Variante Server Components / Route Handlers : Bearer depuis cookies httpOnly,
 * avec refresh automatique sur 401.
 */
export async function apiFetchServer<TData>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<TData> {
  if (options.skipAuth) {
    return apiFetch<TData>(path, options);
  }

  const headers = new Headers(options.headers);
  if (!headers.has("Authorization")) {
    let { accessToken } = await getAuthCookies();
    if (!accessToken) {
      const refreshed = await refreshAuthTokens();
      if (refreshed) {
        accessToken = (await getAuthCookies()).accessToken;
      }
    }
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  try {
    return await apiFetch<TData>(path, { ...options, headers });
  } catch (error) {
    const status =
      error && typeof error === "object" && "statusCode" in error
        ? Number((error as { statusCode: number }).statusCode)
        : 0;

    if (status !== 401 || options._retried) {
      throw error;
    }

    const refreshed = await refreshAuthTokens();
    if (!refreshed) {
      throw error;
    }

    const { accessToken } = await getAuthCookies();
    const retryHeaders = new Headers(options.headers);
    if (accessToken) {
      retryHeaders.set("Authorization", `Bearer ${accessToken}`);
    }

    return apiFetch<TData>(path, {
      ...options,
      headers: retryHeaders,
      _retried: true,
    });
  }
}
