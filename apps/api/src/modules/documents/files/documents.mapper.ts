import type {
  DocumentResponseDto,
  DocumentStatus,
  DocumentVersionResponseDto,
} from './dto/document-response.dto';

export type DocumentRow = {
  id: string;
  organization_id: string;
  document_type_id: string | null;
  title: string;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  checksum: string | null;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type DocumentVersionRow = {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  change_notes: string | null;
  created_by: string | null;
  created_at: string;
};

export function toDocumentResponse(row: DocumentRow): DocumentResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    documentTypeId: row.document_type_id,
    title: row.title,
    fileName: row.file_name,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    uploadedBy: row.uploaded_by,
    checksum: row.checksum,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toDocumentVersionResponse(
  row: DocumentVersionRow,
): DocumentVersionResponseDto {
  return {
    id: row.id,
    documentId: row.document_id,
    versionNumber: row.version_number,
    fileUrl: row.file_url,
    changeNotes: row.change_notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
