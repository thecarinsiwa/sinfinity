import type {
  SalesOrderDocKind,
  SalesOrderDocumentResponseDto,
} from './dto/sales-order-document.dto';

export type SalesOrderDocumentRow = {
  id: string;
  sales_order_id: string;
  document_id: string;
  doc_kind: string | null;
  created_at: string;
};

export function toSalesOrderDocumentResponse(
  row: SalesOrderDocumentRow,
): SalesOrderDocumentResponseDto {
  return {
    id: row.id,
    salesOrderId: row.sales_order_id,
    documentId: row.document_id,
    docKind: row.doc_kind as SalesOrderDocKind | null,
    createdAt: row.created_at,
  };
}
