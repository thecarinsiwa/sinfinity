import type { PurchaseOrderPaymentResponseDto } from './dto/purchase-order-payment.dto';

export type PurchaseOrderPaymentRow = {
  id: string;
  purchase_order_id: string;
  amount: string;
  currency_id: string | null;
  payment_method_id: string | null;
  paid_at: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function toPurchaseOrderPaymentResponse(
  row: PurchaseOrderPaymentRow,
): PurchaseOrderPaymentResponseDto {
  return {
    id: row.id,
    purchaseOrderId: row.purchase_order_id,
    amount: row.amount,
    currencyId: row.currency_id,
    paymentMethodId: row.payment_method_id,
    paidAt: row.paid_at,
    reference: row.reference,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
