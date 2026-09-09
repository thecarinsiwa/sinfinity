/**
 * Port for stock inbound side-effects from purchase receipt confirm.
 * Real inventory_movements (movement_type: 'in', reference_type: 'purchase_receipt')
 * land in Phase 13 — current provider is a no-op.
 */
export const INVENTORY_PORT = Symbol('INVENTORY_PORT');

export type InventoryInboundLine = {
  purchaseOrderItemId: string;
  productId: string | null;
  quantity: string;
};

export type InventoryInboundInput = {
  organizationId: string;
  warehouseId: string | null;
  purchaseReceiptId: string;
  movedAt: string;
  movedBy: string | null;
  lines: InventoryInboundLine[];
};

export interface InventoryPort {
  recordInbound(input: InventoryInboundInput): Promise<void>;
}
