import type { RefundStatus } from '../refund-statuses';
import type { RefundResponseDto } from './dto/refund.dto';

export type RefundRow = {
  id: string;
  organization_id: string;
  invoice_id: string;
  customer_id: string;
  amount: string;
  currency_id: string | null;
  reason: string | null;
  status: RefundStatus;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
};

export function toRefundResponse(row: RefundRow): RefundResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    invoiceId: row.invoice_id,
    customerId: row.customer_id,
    amount: row.amount,
    currencyId: row.currency_id,
    reason: row.reason,
    status: row.status,
    refundedAt: row.refunded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
