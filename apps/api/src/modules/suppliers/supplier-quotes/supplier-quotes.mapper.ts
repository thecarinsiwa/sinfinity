import type { SupplierQuoteStatus } from './supplier-quote-statuses';
import type { SupplierQuoteItemResponseDto } from './dto/supplier-quote-item.dto';
import type { SupplierQuoteResponseDto } from './dto/supplier-quote-response.dto';

export type SupplierQuoteRow = {
  id: string;
  organization_id: string;
  supplier_id: string;
  quote_number: string;
  quote_date: string;
  valid_until: string | null;
  currency_id: string | null;
  status: SupplierQuoteStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
};

export type SupplierQuoteItemRow = {
  id: string;
  supplier_quote_id: string;
  product_id: string | null;
  description: string | null;
  quantity: string;
  unit_price: string;
  lead_time_days: number | null;
  line_total: string;
  created_at: string;
  updated_at: string;
};

export function toSupplierQuoteItemResponse(
  row: SupplierQuoteItemRow,
): SupplierQuoteItemResponseDto {
  return {
    id: row.id,
    supplierQuoteId: row.supplier_quote_id,
    productId: row.product_id,
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    leadTimeDays: row.lead_time_days,
    lineTotal: row.line_total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSupplierQuoteResponse(
  row: SupplierQuoteRow,
  items?: SupplierQuoteItemResponseDto[],
): SupplierQuoteResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    supplierId: row.supplier_id,
    quoteNumber: row.quote_number,
    quoteDate: row.quote_date,
    validUntil: row.valid_until,
    currencyId: row.currency_id,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    ...(items !== undefined ? { items } : {}),
  };
}
