export const SHIPMENT_STATUSES = [
  'booked',
  'in_transit',
  'arrived',
  'cleared',
  'delivered',
  'cancelled',
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const SHIPMENT_STATUS = {
  BOOKED: 'booked',
  IN_TRANSIT: 'in_transit',
  ARRIVED: 'arrived',
  CLEARED: 'cleared',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, ShipmentStatus>;

/**
 * Forward-only: booked → in_transit → arrived → cleared → delivered
 * Cancel allowed until delivered.
 */
export const SHIPMENT_STATUS_TRANSITIONS: Record<
  ShipmentStatus,
  readonly ShipmentStatus[]
> = {
  booked: ['in_transit', 'cancelled'],
  in_transit: ['arrived', 'cancelled'],
  arrived: ['cleared', 'cancelled'],
  cleared: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function assertShipmentTransition(
  from: ShipmentStatus,
  to: ShipmentStatus,
): void {
  if (from === to) {
    throw new Error(`Shipment is already "${from}"`);
  }
  const allowed = SHIPMENT_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

export const SHIPMENT_TRACKING_SOURCES = [
  'manual',
  'api',
  'carrier',
] as const;

export type ShipmentTrackingSource =
  (typeof SHIPMENT_TRACKING_SOURCES)[number];
