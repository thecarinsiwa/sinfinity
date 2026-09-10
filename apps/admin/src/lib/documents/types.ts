/** Aligné API DocumentTypeResponseDto / Create / Update. */

export type DocumentType = {
  id: string;
  organizationId: string | null;
  code: string;
  name: string;
  allowedMimeTypes: string[] | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateDocumentTypeInput = {
  code: string;
  name: string;
  allowedMimeTypes?: string[] | null;
  organizationId?: string;
};

export type UpdateDocumentTypeInput = {
  name?: string;
  allowedMimeTypes?: string[] | null;
};

/** Aligné API DocumentResponseDto. */
export const DOCUMENT_STATUSES = ["active", "archived", "deleted"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  active: "Actif",
  archived: "Archivé",
  deleted: "Supprimé",
};

export type Document = {
  id: string;
  organizationId: string;
  documentTypeId: string | null;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
  uploadedBy: string | null;
  checksum: string | null;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Aligné API DOCUMENT_LINK_ENTITY_TYPES
 * (apps/api/.../document-links.catalog.ts).
 */
export const DOCUMENT_LINK_ENTITY_TYPES = [
  "customer",
  "supplier",
  "lead",
  "sales_order",
  "purchase_order",
  "quotation",
  "procurement_quote",
  "invoice",
  "delivery",
  "shipment",
  "contract",
  "customs_declaration",
  "project",
  "installation",
  "expense",
  "product",
  "service",
] as const;

export type DocumentLinkEntityType =
  (typeof DOCUMENT_LINK_ENTITY_TYPES)[number];

export const DOCUMENT_LINK_ENTITY_TYPE_LABELS: Record<
  DocumentLinkEntityType,
  string
> = {
  customer: "Client",
  supplier: "Fournisseur",
  lead: "Lead",
  sales_order: "Commande vente",
  purchase_order: "Commande achat",
  quotation: "Devis",
  procurement_quote: "Devis achat",
  invoice: "Facture",
  delivery: "Livraison",
  shipment: "Expédition",
  contract: "Contrat",
  customs_declaration: "Déclaration douane",
  project: "Projet",
  installation: "Installation",
  expense: "Dépense",
  product: "Produit",
  service: "Service",
};

export type DocumentsNavItem = {
  title: string;
  description: string;
  href: string;
};

export const DOCUMENTS_NAV_ITEMS: DocumentsNavItem[] = [
  {
    title: "Types documentaires",
    description: "Catalogue code, nom, MIME autorisés (configuration).",
    href: "/documents/types",
  },
  {
    title: "Explorer",
    description: "Liste lecture seule pour support (filtres type / entité).",
    href: "/documents/explorer",
  },
];
