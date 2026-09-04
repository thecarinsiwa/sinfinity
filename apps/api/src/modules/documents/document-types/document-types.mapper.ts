import { DocumentTypeResponseDto } from './dto/document-type-response.dto';

export type DocumentTypeRow = {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  allowed_mime_types: unknown;
  created_at: string;
  updated_at: string;
};

export function parseAllowedMimeTypes(value: unknown): string[] | null {
  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return parseAllowedMimeTypes(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

export function toDocumentTypeResponse(
  row: DocumentTypeRow,
): DocumentTypeResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    allowedMimeTypes: parseAllowedMimeTypes(row.allowed_mime_types),
    isSystem: row.organization_id === null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
