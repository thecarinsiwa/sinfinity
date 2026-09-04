import type { DocumentStatus } from '../files/dto/document-response.dto';
import type {
  DocumentLinkEntityType,
  DocumentLinkRole,
} from './document-links.catalog';
import type { DocumentLinkResponseDto } from './dto/document-link-response.dto';

export type DocumentLinkJoinRow = {
  id: string;
  document_id: string;
  entity_type: string;
  entity_id: string;
  role: string | null;
  created_at: string;
  document_title: string;
  document_file_name: string;
  document_status: DocumentStatus;
  document_mime_type: string | null;
};

export function toDocumentLinkResponse(
  row: DocumentLinkJoinRow,
): DocumentLinkResponseDto {
  return {
    id: row.id,
    documentId: row.document_id,
    entityType: row.entity_type as DocumentLinkEntityType,
    entityId: row.entity_id,
    role: (row.role as DocumentLinkRole | null) ?? null,
    createdAt: row.created_at,
    documentTitle: row.document_title,
    documentFileName: row.document_file_name,
    documentStatus: row.document_status,
    documentMimeType: row.document_mime_type,
  };
}
