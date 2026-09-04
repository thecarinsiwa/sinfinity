import type { ProcurementQuoteStatus } from './procurement-quote-statuses';
import type { ProcurementQuoteItemResponseDto } from './dto/procurement-quote-item.dto';
import type { ProcurementQuoteResponseDto } from './dto/procurement-quote-response.dto';

export type ProcurementQuoteRow = {
  id: string;
  procurement_request_id: string;
  supplier_id: string;
  quote_number: string | null;
  quote_date: string | null;
  valid_until: string | null;
  currency_id: string | null;
  shipping_term_id: string | null;
  lead_time_days: number | null;
  status: ProcurementQuoteStatus;
  total_amount: string;
  created_at: string;
  updated_at: string;
};

export type ProcurementQuoteItemRow = {
  id: string;
  procurement_quote_id: string;
  procurement_request_item_id: string | null;
  product_id: string | null;
  quantity: string;
  unit_price: string;
  lead_time_days: number | null;
  notes: string | null;
  line_total: string;
  created_at: string;
  updated_at: string;
};

export function toProcurementQuoteItemResponse(
  row: ProcurementQuoteItemRow,
): ProcurementQuoteItemResponseDto {
  return {
    id: row.id,
    procurementQuoteId: row.procurement_quote_id,
    procurementRequestItemId: row.procurement_request_item_id,
    productId: row.product_id,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    leadTimeDays: row.lead_time_days,
    notes: row.notes,
    lineTotal: row.line_total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toProcurementQuoteResponse(
  row: ProcurementQuoteRow,
  items?: ProcurementQuoteItemResponseDto[],
): ProcurementQuoteResponseDto {
  return {
    id: row.id,
    procurementRequestId: row.procurement_request_id,
    supplierId: row.supplier_id,
    quoteNumber: row.quote_number,
    quoteDate: row.quote_date,
    validUntil: row.valid_until,
    currencyId: row.currency_id,
    shippingTermId: row.shipping_term_id,
    leadTimeDays: row.lead_time_days,
    status: row.status,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(items !== undefined ? { items } : {}),
  };
}
