import type {
  ProcurementRequestPriority,
  ProcurementRequestStatus,
} from './procurement-request-statuses';
import type { ProcurementRequestItemResponseDto } from './dto/procurement-request-item.dto';
import type { ProcurementRequestResponseDto } from './dto/procurement-request-response.dto';

export type ProcurementRequestRow = {
  id: string;
  organization_id: string;
  request_number: string;
  title: string;
  requested_by: string | null;
  opportunity_id: string | null;
  sales_order_id: string | null;
  needed_by: string | null;
  status: ProcurementRequestStatus;
  priority: ProcurementRequestPriority;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ProcurementRequestItemRow = {
  id: string;
  procurement_request_id: string;
  product_id: string | null;
  description: string | null;
  quantity: string;
  unit_id: string | null;
  target_unit_price: string | null;
  currency_id: string | null;
  created_at: string;
  updated_at: string;
};

export function toProcurementRequestItemResponse(
  row: ProcurementRequestItemRow,
): ProcurementRequestItemResponseDto {
  return {
    id: row.id,
    procurementRequestId: row.procurement_request_id,
    productId: row.product_id,
    description: row.description,
    quantity: row.quantity,
    unitId: row.unit_id,
    targetUnitPrice: row.target_unit_price,
    currencyId: row.currency_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toProcurementRequestResponse(
  row: ProcurementRequestRow,
  items?: ProcurementRequestItemResponseDto[],
): ProcurementRequestResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    requestNumber: row.request_number,
    title: row.title,
    requestedBy: row.requested_by,
    opportunityId: row.opportunity_id,
    salesOrderId: row.sales_order_id,
    neededBy: row.needed_by,
    status: row.status,
    priority: row.priority,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(items !== undefined ? { items } : {}),
  };
}
