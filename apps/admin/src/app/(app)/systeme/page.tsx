import Link from "next/link";
import { ComingSoonPage } from "@/components/layout/coming-soon";

export default function SystemePage() {
  return (
    <div className="flex flex-col gap-4">
      <ComingSoonPage
        title="Système"
        description="Paramètres système et outils techniques. La santé API est déjà disponible."
      />
      <p>
        <Link
          href="/system/health"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          Ouvrir la santé de l’API
        </Link>
      </p>
    </div>
  );
}
