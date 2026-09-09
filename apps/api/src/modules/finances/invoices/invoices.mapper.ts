import type { InvoiceStatus } from '../invoice-statuses';
import type {
  InvoiceItemResponseDto,
  InvoiceResponseDto,
} from './dto/invoice.dto';

export type InvoiceRow = {
  id: string;
  organization_id: string;
  invoice_number: string;
  customer_id: string;
  sales_order_id: string | null;
  issue_date: string;
  due_date: string | null;
  currency_id: string | null;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  amount_paid: string;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
};

export type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  product_id: string | null;
  service_id: string | null;
  description: string | null;
  quantity: string;
  unit_price: string;
  tax_id: string | null;
  line_total: string;
  created_at: string;
  updated_at: string;
};

function toDateOnly(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.slice(0, 10);
}

export function toInvoiceItemResponse(
  row: InvoiceItemRow,
): InvoiceItemResponseDto {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    productId: row.product_id,
    serviceId: row.service_id,
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    taxId: row.tax_id,
    lineTotal: row.line_total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toInvoiceResponse(
  row: InvoiceRow,
  items?: InvoiceItemRow[],
): InvoiceResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    salesOrderId: row.sales_order_id,
    issueDate: toDateOnly(row.issue_date)!,
    dueDate: toDateOnly(row.due_date),
    currencyId: row.currency_id,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    totalAmount: row.total_amount,
    amountPaid: row.amount_paid,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedAt: row.deleted_at,
    items: items?.map(toInvoiceItemResponse),
  };
}
