import type {
  InventoryMovementResponseDto,
  InventoryResponseDto,
  MovementTypeDto,
} from './dto/inventory.dto';

export type InventoryRow = {
  id: string;
  organization_id: string;
  warehouse_id: string;
  location_id: string | null;
  product_id: string;
  batch_id: string | null;
  quantity_on_hand: string;
  quantity_reserved: string;
  quantity_available: string;
  created_at: string;
  updated_at: string;
};

export type InventoryMovementRow = {
  id: string;
  organization_id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string | null;
  movement_type: MovementTypeDto;
  quantity: string;
  reference_type: string | null;
  reference_id: string | null;
  moved_at: string;
  moved_by: string | null;
  notes: string | null;
  created_at: string;
};

export function toInventoryResponse(row: InventoryRow): InventoryResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    warehouseId: row.warehouse_id,
    locationId: row.location_id,
    productId: row.product_id,
    batchId: row.batch_id,
    quantityOnHand: row.quantity_on_hand,
    quantityReserved: row.quantity_reserved,
    quantityAvailable: row.quantity_available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toInventoryMovementResponse(
  row: InventoryMovementRow,
): InventoryMovementResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    productId: row.product_id,
    warehouseId: row.warehouse_id,
    locationId: row.location_id,
    movementType: row.movement_type,
    quantity: row.quantity,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    movedAt: row.moved_at,
    movedBy: row.moved_by,
    notes: row.notes,
    createdAt: row.created_at,
  };
}
