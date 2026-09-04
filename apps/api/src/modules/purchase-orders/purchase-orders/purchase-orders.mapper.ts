import type { PurchaseOrderStatus } from './purchase-order-statuses';
import type { PurchaseOrderItemResponseDto } from './dto/purchase-order-item.dto';
import type { PurchaseOrderResponseDto } from './dto/purchase-order-response.dto';

export type PurchaseOrderRow = {
  id: string;
  organization_id: string;
  po_number: string;
  supplier_id: string;
  procurement_request_id: string | null;
  procurement_quote_id: string | null;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_date: string | null;
  currency_id: string | null;
  shipping_term_id: string | null;
  payment_term_id: string | null;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  buyer_user_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PurchaseOrderItemRow = {
  id: string;
  purchase_order_id: string;
  product_id: string | null;
  description: string | null;
  quantity: string;
  quantity_received: string;
  unit_price: string;
  line_total: string;
  created_at: string;
  updated_at: string;
};

export function toPurchaseOrderItemResponse(
  row: PurchaseOrderItemRow,
): PurchaseOrderItemResponseDto {
  return {
    id: row.id,
    purchaseOrderId: row.purchase_order_id,
    productId: row.product_id,
    description: row.description,
    quantity: row.quantity,
    quantityReceived: row.quantity_received,
    unitPrice: row.unit_price,
    lineTotal: row.line_total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPurchaseOrderResponse(
  row: PurchaseOrderRow,
  items?: PurchaseOrderItemResponseDto[],
): PurchaseOrderResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    poNumber: row.po_number,
    supplierId: row.supplier_id,
    procurementRequestId: row.procurement_request_id,
    procurementQuoteId: row.procurement_quote_id,
    status: row.status,
    orderDate: row.order_date,
    expectedDate: row.expected_date,
    currencyId: row.currency_id,
    shippingTermId: row.shipping_term_id,
    paymentTermId: row.payment_term_id,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    totalAmount: row.total_amount,
    buyerUserId: row.buyer_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(items !== undefined ? { items } : {}),
  };
}
