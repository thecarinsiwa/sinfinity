import type {
  DeliveryItemResponseDto,
  DeliveryResponseDto,
} from './dto/delivery.dto';
import type { DeliveryStatus } from '../delivery-statuses';

export type DeliveryRow = {
  id: string;
  organization_id: string;
  delivery_number: string;
  sales_order_id: string | null;
  customer_id: string;
  warehouse_id: string | null;
  delivery_address_id: string | null;
  scheduled_at: string | null;
  delivered_at: string | null;
  driver_user_id: string | null;
  status: DeliveryStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
};

export type DeliveryItemRow = {
  id: string;
  delivery_id: string;
  sales_order_item_id: string | null;
  product_id: string | null;
  quantity: string;
  serial_number_ids: unknown;
  created_at: string;
  updated_at: string;
};

function parseSerialIds(value: unknown): string[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export { parseSerialIds };

export function toDeliveryResponse(
  row: DeliveryRow,
  items?: DeliveryItemRow[],
): DeliveryResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    deliveryNumber: row.delivery_number,
    salesOrderId: row.sales_order_id,
    customerId: row.customer_id,
    warehouseId: row.warehouse_id,
    deliveryAddressId: row.delivery_address_id,
    scheduledAt: row.scheduled_at,
    deliveredAt: row.delivered_at,
    driverUserId: row.driver_user_id,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedAt: row.deleted_at,
    items: items?.map(toDeliveryItemResponse),
  };
}

export function toDeliveryItemResponse(
  row: DeliveryItemRow,
): DeliveryItemResponseDto {
  return {
    id: row.id,
    deliveryId: row.delivery_id,
    salesOrderItemId: row.sales_order_item_id,
    productId: row.product_id,
    quantity: row.quantity,
    serialNumberIds: parseSerialIds(row.serial_number_ids),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
