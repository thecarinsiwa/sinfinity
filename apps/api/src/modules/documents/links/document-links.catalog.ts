/**
 * Allowed polymorphic entity_type values for document_links.
 * Keep in sync with modules that attach documents (see database/modules/16_documents.md).
 */
export const DOCUMENT_LINK_ENTITY_TYPES = [
  'customer',
  'supplier',
  'lead',
  'sales_order',
  'purchase_order',
  'quotation',
  'procurement_quote',
  'invoice',
  'delivery',
  'shipment',
  'contract',
  'customs_declaration',
  'project',
  'installation',
  'expense',
  'product',
  'service',
] as const;

export type DocumentLinkEntityType =
  (typeof DOCUMENT_LINK_ENTITY_TYPES)[number];

/** Allowed link roles (optional on create). */
export const DOCUMENT_LINK_ROLES = [
  'primary',
  'attachment',
  'evidence',
] as const;

export type DocumentLinkRole = (typeof DOCUMENT_LINK_ROLES)[number];

const ENTITY_TYPE_SET = new Set<string>(DOCUMENT_LINK_ENTITY_TYPES);
const ROLE_SET = new Set<string>(DOCUMENT_LINK_ROLES);

export function isAllowedDocumentLinkEntityType(
  value: string,
): value is DocumentLinkEntityType {
  return ENTITY_TYPE_SET.has(value);
}

export function isAllowedDocumentLinkRole(
  value: string,
): value is DocumentLinkRole {
  return ROLE_SET.has(value);
}
