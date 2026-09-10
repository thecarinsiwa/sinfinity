import { getApiBaseUrl } from "@/lib/api/client";
import { parseApiErrorBody, type ApiErrorBody } from "@/lib/api";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type AuthMe = {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  branchId: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  permissions: string[];
  isSuperAdmin: boolean;
};

export type SessionOrganization = {
  id: string;
  name: string;
};

export type SessionPayload = {
  user: AuthMe;
  organization: SessionOrganization | null;
};

type NestResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; body: ApiErrorBody | null; rawText: string };

function buildNestUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalized}`;
}

export async function nestFetch<T>(
  path: string,
  init: RequestInit & { accessToken?: string | null } = {},
): Promise<NestResult<T>> {
  const { accessToken, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);

  if (typeof rest.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(buildNestUrl(path), {
      ...rest,
      headers,
      cache: "no-store",
    });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "Network request failed";
    return {
      ok: false,
      status: 502,
      body: {
        statusCode: 502,
        message,
        error: "Bad Gateway",
      },
      rawText: message,
    };
  }

  const rawText = await response.text();
  const payload = rawText.length > 0 ? tryParseJson(rawText) : null;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      body: parseApiErrorBody(payload),
      rawText,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: payload as T,
  };
}

export function jsonError(
  status: number,
  body: ApiErrorBody | null,
  fallbackMessage: string,
): Response {
  return Response.json(
    body ?? {
      statusCode: status,
      message: fallbackMessage,
      error: statusText(status),
    },
    { status },
  );
}

function statusText(status: number): string {
  switch (status) {
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not Found";
    case 502:
      return "Bad Gateway";
    default:
      return "Error";
  }
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
