"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Spinner } from "@/components/ui";
import { hasAdminConsoleAccess } from "@/lib/auth/admin-access";

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const { status, permissions, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allowed =
    status === "authenticated" &&
    hasAdminConsoleAccess({ isSuperAdmin, permissions });

  useEffect(() => {
    if (status === "authenticated" && !allowed) {
      router.replace("/forbidden");
    }
  }, [status, allowed, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Spinner label={t("loadingSession")} />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Spinner label={t("redirectingLogin")} />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Spinner label={t("checkingAccess")} />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 bg-background">
      {mobileOpen ? (
        <button
          type="button"
          aria-label={t("closeMenu")}
          className="fixed inset-0 z-30 bg-foreground/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <Sidebar open={mobileOpen} onNavigate={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen((value) => !value)} />
        <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,_rgb(15_107_107_/_0.05),_transparent_55%)] p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
