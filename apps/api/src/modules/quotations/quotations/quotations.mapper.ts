import type { QuotationStatusResponseDto } from '../quotation-statuses/dto/quotation-status-response.dto';
import type { QuotationItemResponseDto } from './dto/quotation-item.dto';
import type { QuotationResponseDto } from './dto/quotation-response.dto';
import type { QuotationTermsResponseDto } from './dto/quotation-terms.dto';

export type QuotationRow = {
  id: string;
  organization_id: string;
  quote_number: string;
  customer_id: string;
  opportunity_id: string | null;
  status_id: string | null;
  version: number;
  issue_date: string | null;
  valid_until: string | null;
  currency_id: string | null;
  exchange_rate: string | null;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  owner_user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type QuotationItemRow = {
  id: string;
  quotation_id: string;
  line_number: number;
  product_id: string | null;
  service_id: string | null;
  description: string | null;
  quantity: string;
  unit_id: string | null;
  unit_price: string;
  discount_percent: string;
  tax_id: string | null;
  line_total: string;
  created_at: string;
  updated_at: string;
};

export type QuotationTermsRow = {
  id: string;
  quotation_id: string;
  payment_term_id: string | null;
  shipping_term_id: string | null;
  warranty_text: string | null;
  delivery_lead_time_days: number | null;
  additional_terms: string | null;
  created_at: string;
  updated_at: string;
};

export function toQuotationItemResponse(
  row: QuotationItemRow,
): QuotationItemResponseDto {
  return {
    id: row.id,
    quotationId: row.quotation_id,
    lineNumber: row.line_number,
    productId: row.product_id,
    serviceId: row.service_id,
    description: row.description,
    quantity: row.quantity,
    unitId: row.unit_id,
    unitPrice: row.unit_price,
    discountPercent: row.discount_percent,
    taxId: row.tax_id,
    lineTotal: row.line_total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toQuotationTermsResponse(
  row: QuotationTermsRow,
): QuotationTermsResponseDto {
  return {
    id: row.id,
    quotationId: row.quotation_id,
    paymentTermId: row.payment_term_id,
    shippingTermId: row.shipping_term_id,
    warrantyText: row.warranty_text,
    deliveryLeadTimeDays: row.delivery_lead_time_days,
    additionalTerms: row.additional_terms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toQuotationResponse(
  row: QuotationRow,
  nested?: {
    status?: QuotationStatusResponseDto;
    items?: QuotationItemResponseDto[];
    terms?: QuotationTermsResponseDto | null;
  },
): QuotationResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    quoteNumber: row.quote_number,
    customerId: row.customer_id,
    opportunityId: row.opportunity_id,
    statusId: row.status_id,
    version: row.version,
    issueDate: row.issue_date,
    validUntil: row.valid_until,
    currencyId: row.currency_id,
    exchangeRate: row.exchange_rate,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    totalAmount: row.total_amount,
    ownerUserId: row.owner_user_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(nested?.status !== undefined ? { status: nested.status } : {}),
    ...(nested?.items !== undefined ? { items: nested.items } : {}),
    ...(nested?.terms !== undefined ? { terms: nested.terms } : {}),
  };
}
