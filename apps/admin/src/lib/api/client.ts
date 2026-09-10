import { getAccessToken } from "./auth-token";
import { ApiError, parseApiErrorBody } from "./errors";

const DEFAULT_API_URL = "http://localhost:4000/api/v1";

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Skip Authorization / BFF proxy auth (ex. health public). */
  skipAuth?: boolean;
  /** Internal: do not retry after a refresh attempt. */
  _retried?: boolean;
};

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
  return raw.replace(/\/+$/, "");
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/** URL Nest directe (Server Components, skipAuth, outils). */
export function buildNestUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${getApiBaseUrl()}${normalizePath(path)}`;
}

/** URL same-origin via proxy BFF (navigateur authentifié). */
export function buildBackendProxyUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `/api/backend${normalizePath(path)}`;
}

async function resolveServerAccessToken(): Promise<string | null> {
  const fromGetter = getAccessToken();
  if (fromGetter) {
    return fromGetter;
  }

  try {
    const { getAuthCookies } = await import("@/lib/auth/cookies");
    const { accessToken } = await getAuthCookies();
    return accessToken;
  } catch {
    return null;
  }
}

async function tryServerRefresh(): Promise<boolean> {
  try {
    const { refreshAuthTokens } = await import("@/lib/auth/session");
    return refreshAuthTokens();
  } catch {
    return false;
  }
}

async function tryBrowserRefresh(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Client HTTP typé vers l’API Nest.
 * - Navigateur + auth : `/api/backend/*` (cookies httpOnly + refresh proxy)
 * - Serveur + auth : Nest direct avec Bearer depuis cookie / getter
 * - skipAuth : Nest direct (ex. GET /health)
 */
export async function apiFetch<TData>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<TData> {
  const {
    body,
    skipAuth = false,
    _retried = false,
    headers: initHeaders,
    ...rest
  } = options;

  const headers = new Headers(initHeaders);
  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const useBrowserProxy = isBrowser() && !skipAuth;
  const url = useBrowserProxy ? buildBackendProxyUrl(path) : buildNestUrl(path);

  if (!skipAuth && !useBrowserProxy && !headers.has("Authorization")) {
    const token = await resolveServerAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      credentials: useBrowserProxy ? "same-origin" : rest.credentials,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Network request failed";
    throw new ApiError(0, null, message);
  }

  if (response.status === 401 && !skipAuth && !_retried) {
    const refreshed = useBrowserProxy
      ? await tryBrowserRefresh()
      : await tryServerRefresh();

    if (refreshed) {
      return apiFetch<TData>(path, { ...options, _retried: true });
    }
  }

  const text = await response.text();
  const payload = text.length > 0 ? tryParseJson(text) : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      parseApiErrorBody(payload),
      response.statusText || `HTTP ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as TData;
  }

  return payload as TData;
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
