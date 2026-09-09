import type { LandedCostStatus } from './landed-cost-statuses';
import type { LandedCostItemResponseDto } from './dto/landed-cost-item.dto';
import type { LandedCostResponseDto } from './dto/landed-cost-response.dto';

export type LandedCostRow = {
  id: string;
  organization_id: string;
  reference: string;
  purchase_order_id: string | null;
  shipment_id: string | null;
  currency_id: string | null;
  goods_cost: string;
  total_additional_costs: string;
  total_landed_cost: string;
  status: LandedCostStatus;
  calculated_at: string | null;
  calculated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type LandedCostItemRow = {
  id: string;
  landed_cost_id: string;
  product_id: string | null;
  purchase_order_item_id: string | null;
  quantity: string;
  goods_cost: string;
  allocated_costs: string;
  unit_landed_cost: string;
  total_landed_cost: string;
  created_at: string;
  updated_at: string;
};

export function toLandedCostItemResponse(
  row: LandedCostItemRow,
): LandedCostItemResponseDto {
  return {
    id: row.id,
    landedCostId: row.landed_cost_id,
    productId: row.product_id,
    purchaseOrderItemId: row.purchase_order_item_id,
    quantity: row.quantity,
    goodsCost: row.goods_cost,
    allocatedCosts: row.allocated_costs,
    unitLandedCost: row.unit_landed_cost,
    totalLandedCost: row.total_landed_cost,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toLandedCostResponse(
  row: LandedCostRow,
  items?: LandedCostItemResponseDto[],
): LandedCostResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    reference: row.reference,
    purchaseOrderId: row.purchase_order_id,
    shipmentId: row.shipment_id,
    currencyId: row.currency_id,
    goodsCost: row.goods_cost,
    totalAdditionalCosts: row.total_additional_costs,
    totalLandedCost: row.total_landed_cost,
    status: row.status,
    calculatedAt: row.calculated_at,
    calculatedBy: row.calculated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(items !== undefined ? { items } : {}),
  };
}
