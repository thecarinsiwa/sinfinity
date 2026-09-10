import { getAccessToken } from "./auth-token";
import { ApiError, parseApiErrorBody } from "./errors";

const DEFAULT_API_URL = "http://localhost:4000/api/v1";

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Skip Authorization even if a token getter is registered. */
  skipAuth?: boolean;
};

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
  return raw.replace(/\/+$/, "");
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

/**
 * Client HTTP typé vers l’API Nest (`NEXT_PUBLIC_API_URL`).
 * Compatible Server Components et client.
 */
export async function apiFetch<TData>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<TData> {
  const { body, skipAuth = false, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth && !headers.has("Authorization")) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...rest,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Network request failed";
    throw new ApiError(0, null, message);
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

  return payload as TData;
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
