import Link from "next/link";
import { Badge } from "@/components/ui";
import { CATALOGUE_NAV_ITEMS } from "@/lib/catalogue";

export function CatalogueHub() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Catalogue
        </h1>
        <p className="mt-1 text-sm text-muted">
          Référentiels marques / catégories et bootstrap produits allégé. La
          fiche produit riche (specs, images) reste sur l’app Web.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CATALOGUE_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-medium text-foreground">{item.title}</h2>
              <Badge tone="primary">Ouvrir</Badge>
            </div>
            <p className="text-sm text-muted">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
