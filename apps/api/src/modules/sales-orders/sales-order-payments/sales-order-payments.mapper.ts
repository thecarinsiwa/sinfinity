import type {
  SalesOrderPaymentResponseDto,
  SalesOrderPaymentType,
} from './dto/sales-order-payment.dto';

export type SalesOrderPaymentRow = {
  id: string;
  sales_order_id: string;
  payment_id: string | null;
  payment_type: SalesOrderPaymentType;
  amount: string;
  currency_id: string | null;
  paid_at: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
};

export function toSalesOrderPaymentResponse(
  row: SalesOrderPaymentRow,
): SalesOrderPaymentResponseDto {
  return {
    id: row.id,
    salesOrderId: row.sales_order_id,
    paymentId: row.payment_id,
    paymentType: row.payment_type,
    amount: row.amount,
    currencyId: row.currency_id,
    paidAt: row.paid_at,
    reference: row.reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
