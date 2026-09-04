import type { SupplierDocumentResponseDto } from './dto/supplier-document.dto';

export type SupplierDocumentRow = {
  id: string;
  supplier_id: string;
  document_id: string;
  doc_kind: string | null;
  expires_at: string | null;
  created_at: string;
};

export function toSupplierDocumentResponse(
  row: SupplierDocumentRow,
): SupplierDocumentResponseDto {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    documentId: row.document_id,
    docKind: row.doc_kind,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}
