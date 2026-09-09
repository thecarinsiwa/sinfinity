import type { ShipmentStatus, ShipmentTrackingSource } from './shipment-statuses';
import type {
  ShipmentItemResponseDto,
  ShipmentResponseDto,
  ShipmentTrackingResponseDto,
} from './dto/shipment.dto';

export type ShipmentRow = {
  id: string;
  organization_id: string;
  shipment_number: string;
  purchase_order_id: string | null;
  carrier_id: string | null;
  shipping_method_id: string | null;
  container_number: string | null;
  bl_number: string | null;
  origin_country_id: string | null;
  destination_country_id: string | null;
  etd: string | null;
  eta: string | null;
  atd: string | null;
  ata: string | null;
  status: ShipmentStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ShipmentItemRow = {
  id: string;
  shipment_id: string;
  purchase_order_item_id: string | null;
  product_id: string | null;
  quantity: string;
  weight_kg: string | null;
  volume_cbm: string | null;
  created_at: string;
  updated_at: string;
};

export type ShipmentTrackingRow = {
  id: string;
  shipment_id: string;
  status: string;
  location: string | null;
  event_at: string;
  description: string | null;
  source: ShipmentTrackingSource;
  created_at: string;
};

export function toShipmentItemResponse(
  row: ShipmentItemRow,
): ShipmentItemResponseDto {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    purchaseOrderItemId: row.purchase_order_item_id,
    productId: row.product_id,
    quantity: row.quantity,
    weightKg: row.weight_kg,
    volumeCbm: row.volume_cbm,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toShipmentTrackingResponse(
  row: ShipmentTrackingRow,
): ShipmentTrackingResponseDto {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    status: row.status,
    location: row.location,
    eventAt: row.event_at,
    description: row.description,
    source: row.source,
    createdAt: row.created_at,
  };
}

export function toShipmentResponse(
  row: ShipmentRow,
  items?: ShipmentItemResponseDto[],
): ShipmentResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    shipmentNumber: row.shipment_number,
    purchaseOrderId: row.purchase_order_id,
    carrierId: row.carrier_id,
    shippingMethodId: row.shipping_method_id,
    containerNumber: row.container_number,
    blNumber: row.bl_number,
    originCountryId: row.origin_country_id,
    destinationCountryId: row.destination_country_id,
    etd: row.etd,
    eta: row.eta,
    atd: row.atd,
    ata: row.ata,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(items !== undefined ? { items } : {}),
  };
}
