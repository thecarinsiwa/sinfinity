import { cookies } from "next/headers";
import type { ApiErrorBody } from "@/lib/api/types";
import {
  clearAuthCookies,
  getAuthCookies,
  setAuthCookies,
} from "@/lib/auth/cookies";
import {
  nestFetch,
  type AuthMe,
  type AuthTokens,
  type SessionOrganization,
  type SessionPayload,
} from "@/lib/auth/nest";

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<
  | { ok: true; tokens: AuthTokens }
  | { ok: false; status: number; body: ApiErrorBody | null }
> {
  const result = await nestFetch<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!result.ok) {
    return { ok: false, status: result.status, body: result.body };
  }

  const jar = await cookies();
  setAuthCookies(jar, result.data);
  return { ok: true, tokens: result.data };
}

export async function refreshAuthTokens(): Promise<boolean> {
  const { refreshToken } = await getAuthCookies();
  if (!refreshToken) {
    return false;
  }

  const result = await nestFetch<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });

  if (!result.ok) {
    const jar = await cookies();
    clearAuthCookies(jar);
    return false;
  }

  const jar = await cookies();
  setAuthCookies(jar, result.data);
  return true;
}

export async function logoutCurrentSession(): Promise<void> {
  const { accessToken } = await getAuthCookies();
  if (accessToken) {
    await nestFetch<null>("/auth/logout", {
      method: "POST",
      accessToken,
    });
  }
  const jar = await cookies();
  clearAuthCookies(jar);
}

export async function loadSession(): Promise<
  | { ok: true; data: SessionPayload }
  | { ok: false; status: number; body: ApiErrorBody | null }
> {
  let { accessToken } = await getAuthCookies();

  if (!accessToken) {
    const refreshed = await refreshAuthTokens();
    if (!refreshed) {
      return {
        ok: false,
        status: 401,
        body: {
          statusCode: 401,
          message: "Not authenticated",
          error: "Unauthorized",
        },
      };
    }
    accessToken = (await getAuthCookies()).accessToken;
  }

  if (!accessToken) {
    return {
      ok: false,
      status: 401,
      body: {
        statusCode: 401,
        message: "Not authenticated",
        error: "Unauthorized",
      },
    };
  }

  let meResult = await nestFetch<AuthMe>("/auth/me", { accessToken });

  if (!meResult.ok && meResult.status === 401) {
    const refreshed = await refreshAuthTokens();
    if (!refreshed) {
      return { ok: false, status: 401, body: meResult.body };
    }
    accessToken = (await getAuthCookies()).accessToken;
    if (!accessToken) {
      return { ok: false, status: 401, body: meResult.body };
    }
    meResult = await nestFetch<AuthMe>("/auth/me", { accessToken });
  }

  if (!meResult.ok) {
    return { ok: false, status: meResult.status, body: meResult.body };
  }

  const organization = await loadOrganizationName(
    meResult.data.organizationId,
    accessToken,
    meResult.data.permissions,
  );

  return {
    ok: true,
    data: {
      user: meResult.data,
      organization,
    },
  };
}

async function loadOrganizationName(
  organizationId: string,
  accessToken: string,
  permissions: string[],
): Promise<SessionOrganization | null> {
  if (!permissions.includes("organizations.read")) {
    return { id: organizationId, name: "Organisation" };
  }

  const result = await nestFetch<{ id: string; name: string }>(
    `/organizations/${organizationId}`,
    { accessToken },
  );

  if (!result.ok) {
    return { id: organizationId, name: "Organisation" };
  }

  return { id: result.data.id, name: result.data.name };
}
