import type {
  PurchaseReceiptResponseDto,
  PurchaseReceiptStatus,
} from './dto/purchase-receipt.dto';

export type PurchaseReceiptRow = {
  id: string;
  organization_id: string;
  purchase_order_id: string;
  receipt_number: string;
  warehouse_id: string | null;
  received_at: string | null;
  received_by: string | null;
  shipment_id: string | null;
  notes: string | null;
  status: PurchaseReceiptStatus;
  created_at: string;
  updated_at: string;
};

export function toPurchaseReceiptResponse(
  row: PurchaseReceiptRow,
): PurchaseReceiptResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    purchaseOrderId: row.purchase_order_id,
    receiptNumber: row.receipt_number,
    warehouseId: row.warehouse_id,
    receivedAt: row.received_at,
    receivedBy: row.received_by,
    shipmentId: row.shipment_id,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
