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

export type DocumentsNavId = "types" | "explorer";

export type DocumentsNavItem = {
  id: DocumentsNavId;
  href: string;
};

export const DOCUMENTS_NAV_ITEMS: DocumentsNavItem[] = [
  { id: "types", href: "/documents/types" },
  { id: "explorer", href: "/documents/explorer" },
];
