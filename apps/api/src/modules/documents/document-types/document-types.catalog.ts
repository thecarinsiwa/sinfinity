/**
 * System document types (organization_id NULL).
 * Seeded idempotently via DocumentTypesSeedService.
 */
export type SystemDocumentTypeDef = {
  code: string;
  name: string;
  allowedMimeTypes: string[];
};

const PDF = 'application/pdf';
const JPEG = 'image/jpeg';
const PNG = 'image/png';
const WEBP = 'image/webp';
const DOC = 'application/msword';
const DOCX =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLS = 'application/vnd.ms-excel';
const XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const OFFICE_AND_PDF = [PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG];
const PDF_AND_IMAGES = [PDF, JPEG, PNG, WEBP];

export const SYSTEM_DOCUMENT_TYPES: SystemDocumentTypeDef[] = [
  {
    code: 'QUOTE',
    name: 'Quotation',
    allowedMimeTypes: OFFICE_AND_PDF,
  },
  {
    code: 'INVOICE',
    name: 'Invoice',
    allowedMimeTypes: OFFICE_AND_PDF,
  },
  {
    code: 'BL',
    name: 'Bill of lading / delivery note',
    allowedMimeTypes: PDF_AND_IMAGES,
  },
  {
    code: 'CONTRACT',
    name: 'Contract',
    allowedMimeTypes: [PDF, DOC, DOCX],
  },
  {
    code: 'PO',
    name: 'Purchase order',
    allowedMimeTypes: OFFICE_AND_PDF,
  },
  {
    code: 'OTHER',
    name: 'Other document',
    allowedMimeTypes: [...OFFICE_AND_PDF, WEBP],
  },
];
