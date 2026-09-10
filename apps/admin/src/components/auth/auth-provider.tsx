"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { parseApiErrorBody } from "@/lib/api/errors";
import type {
  AuthMe,
  SessionOrganization,
  SessionPayload,
} from "@/lib/auth";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthMe | null;
  organization: SessionOrganization | null;
  permissions: string[];
  isSuperAdmin: boolean;
  hasPermission: (code: string) => boolean;
  refreshSession: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_PATH_PREFIXES = ["/login", "/forbidden", "/system/health", "/dev/ui"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function fetchSession(): Promise<SessionPayload | null> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const body = parseApiErrorBody(payload);
    throw new Error(
      body
        ? Array.isArray(body.message)
          ? body.message.join("; ")
          : body.message
        : `HTTP ${response.status}`,
    );
  }

  return (await response.json()) as SessionPayload;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthMe | null>(null);
  const [organization, setOrganization] = useState<SessionOrganization | null>(
    null,
  );

  const applySession = useCallback((session: SessionPayload | null) => {
    if (!session) {
      setUser(null);
      setOrganization(null);
      setStatus("anonymous");
      return;
    }
    setUser(session.user);
    setOrganization(session.organization);
    setStatus("authenticated");
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await fetchSession();
      applySession(session);
      return session !== null;
    } catch {
      applySession(null);
      return false;
    }
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await fetchSession();
        if (!cancelled) {
          applySession(session);
        }
      } catch {
        if (!cancelled) {
          applySession(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  useEffect(() => {
    if (status !== "anonymous") {
      return;
    }
    if (isPublicPath(pathname)) {
      return;
    }
    router.replace("/login");
  }, [status, pathname, router]);

  useEffect(() => {
    if (status === "authenticated" && pathname === "/login") {
      router.replace("/");
    }
  }, [status, pathname, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const body = parseApiErrorBody(payload);
        const message = body
          ? Array.isArray(body.message)
            ? body.message.join("; ")
            : body.message
          : "Identifiants invalides";
        throw new Error(message);
      }

      const ok = await refreshSession();
      if (!ok) {
        throw new Error("Connexion réussie mais session indisponible");
      }
      router.replace("/");
    },
    [refreshSession, router],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      applySession(null);
      router.replace("/login");
    }
  }, [applySession, router]);

  const permissions = user?.permissions ?? [];
  const isSuperAdmin = user?.isSuperAdmin === true;

  const hasPermission = useCallback(
    (code: string) => {
      if (isSuperAdmin) {
        return true;
      }
      return permissions.includes(code);
    },
    [isSuperAdmin, permissions],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      organization,
      permissions,
      isSuperAdmin,
      hasPermission,
      refreshSession,
      login,
      logout,
    }),
    [
      status,
      user,
      organization,
      permissions,
      isSuperAdmin,
      hasPermission,
      refreshSession,
      login,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function usePermissions() {
  const { permissions, hasPermission, isSuperAdmin, status } = useAuth();
  return { permissions, hasPermission, isSuperAdmin, status };
}
