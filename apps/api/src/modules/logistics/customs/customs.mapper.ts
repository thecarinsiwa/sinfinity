import type {
  CustomsDeclarationResponseDto,
  CustomsDeclarationStatus,
  CustomsDocumentResponseDto,
  ImportDocumentResponseDto,
  ImportDocKind,
} from './dto/customs.dto';

export type CustomsDeclarationRow = {
  id: string;
  organization_id: string;
  shipment_id: string | null;
  declaration_number: string | null;
  regime: string | null;
  declared_value: string | null;
  currency_id: string | null;
  status: CustomsDeclarationStatus;
  cleared_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CustomsDocumentRow = {
  id: string;
  customs_declaration_id: string;
  document_id: string;
  doc_kind: string | null;
  created_at: string;
};

export type ImportDocumentRow = {
  id: string;
  shipment_id: string;
  document_id: string;
  doc_kind: string | null;
  created_at: string;
};

export function toCustomsDeclarationResponse(
  row: CustomsDeclarationRow,
): CustomsDeclarationResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    shipmentId: row.shipment_id,
    declarationNumber: row.declaration_number,
    regime: row.regime,
    declaredValue: row.declared_value,
    currencyId: row.currency_id,
    status: row.status,
    clearedAt: row.cleared_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCustomsDocumentResponse(
  row: CustomsDocumentRow,
): CustomsDocumentResponseDto {
  return {
    id: row.id,
    customsDeclarationId: row.customs_declaration_id,
    documentId: row.document_id,
    docKind: row.doc_kind,
    createdAt: row.created_at,
  };
}

export function toImportDocumentResponse(
  row: ImportDocumentRow,
): ImportDocumentResponseDto {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    documentId: row.document_id,
    docKind: row.doc_kind as ImportDocKind | null,
    createdAt: row.created_at,
  };
}
