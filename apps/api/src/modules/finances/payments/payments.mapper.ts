import type { PaymentStatus } from '../payment-statuses';
import type { PaymentResponseDto } from './dto/payment.dto';

export type PaymentRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  invoice_id: string | null;
  payment_method_id: string | null;
  amount: string;
  currency_id: string | null;
  paid_at: string;
  reference: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
};

function toMysqlDateTime(value: string): string {
  return value.replace('T', ' ').replace('Z', '').slice(0, 23);
}

export function toPaymentResponse(row: PaymentRow): PaymentResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    invoiceId: row.invoice_id,
    paymentMethodId: row.payment_method_id,
    amount: row.amount,
    currencyId: row.currency_id,
    paidAt: row.paid_at,
    reference: row.reference,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export { toMysqlDateTime as paymentPaidAtToMysql };
