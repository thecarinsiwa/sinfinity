/**
 * Port for stock inbound side-effects from purchase receipt confirm.
 * Implemented by StockInventoryPortAdapter (Phase 13) via applyMovement
 * (movement_type: 'in', reference_type: 'purchase_receipt').
 */
export const INVENTORY_PORT = Symbol('INVENTORY_PORT');

export type InventoryInboundLine = {
  purchaseOrderItemId: string;
  productId: string | null;
  quantity: string;
  /** Required when product.is_serialized — creates in_stock serials on receipt. */
  serialNumbers?: string[];
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
