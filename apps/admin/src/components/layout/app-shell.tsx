"use client";

import { useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Spinner } from "@/components/ui";

export function AppShell({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Spinner label="Chargement de la session…" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <Spinner label="Redirection vers la connexion…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 bg-background">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-30 bg-foreground/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <Sidebar open={mobileOpen} onNavigate={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen((value) => !value)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
