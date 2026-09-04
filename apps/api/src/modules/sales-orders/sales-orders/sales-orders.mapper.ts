import type { SalesOrderStatus } from './sales-order-statuses';
import type { SalesOrderItemResponseDto } from './dto/sales-order-item.dto';
import type { SalesOrderResponseDto } from './dto/sales-order-response.dto';
import type { SalesOrderStatusHistoryResponseDto } from './dto/sales-order-status-history.dto';

export type SalesOrderRow = {
  id: string;
  organization_id: string;
  order_number: string;
  customer_id: string;
  quotation_id: string | null;
  branch_id: string | null;
  status: SalesOrderStatus;
  order_date: string;
  requested_delivery_date: string | null;
  currency_id: string | null;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  billing_address_id: string | null;
  shipping_address_id: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SalesOrderItemRow = {
  id: string;
  sales_order_id: string;
  product_id: string | null;
  service_id: string | null;
  description: string | null;
  quantity: string;
  quantity_delivered: string;
  unit_price: string;
  tax_id: string | null;
  line_total: string;
  created_at: string;
  updated_at: string;
};

export function toSalesOrderItemResponse(
  row: SalesOrderItemRow,
): SalesOrderItemResponseDto {
  return {
    id: row.id,
    salesOrderId: row.sales_order_id,
    productId: row.product_id,
    serviceId: row.service_id,
    description: row.description,
    quantity: row.quantity,
    quantityDelivered: row.quantity_delivered,
    unitPrice: row.unit_price,
    taxId: row.tax_id,
    lineTotal: row.line_total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSalesOrderResponse(
  row: SalesOrderRow,
  items?: SalesOrderItemResponseDto[],
): SalesOrderResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    quotationId: row.quotation_id,
    branchId: row.branch_id,
    status: row.status,
    orderDate: row.order_date,
    requestedDeliveryDate: row.requested_delivery_date,
    currencyId: row.currency_id,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    totalAmount: row.total_amount,
    billingAddressId: row.billing_address_id,
    shippingAddressId: row.shipping_address_id,
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(items !== undefined ? { items } : {}),
  };
}

export type SalesOrderStatusHistoryRow = {
  id: string;
  sales_order_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
};

export function toSalesOrderStatusHistoryResponse(
  row: SalesOrderStatusHistoryRow,
): SalesOrderStatusHistoryResponseDto {
  return {
    id: row.id,
    salesOrderId: row.sales_order_id,
    fromStatus: row.from_status as SalesOrderStatus | null,
    toStatus: row.to_status as SalesOrderStatus,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
    notes: row.notes,
  };
}
