export const DELIVERY_STATUSES = [
  'planned',
  'in_transit',
  'delivered',
  'failed',
  'cancelled',
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const DELIVERY_STATUS = {
  PLANNED: 'planned',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, DeliveryStatus>;

/**
 * planned → in_transit → delivered
 * fail/cancel from planned or in_transit.
 */
export const DELIVERY_STATUS_TRANSITIONS: Record<
  DeliveryStatus,
  readonly DeliveryStatus[]
> = {
  planned: ['in_transit', 'cancelled', 'failed'],
  in_transit: ['delivered', 'failed', 'cancelled'],
  delivered: [],
  failed: [],
  cancelled: [],
};

export function assertDeliveryTransition(
  from: DeliveryStatus,
  to: DeliveryStatus,
): void {
  if (from === to) {
    throw new Error(`Delivery is already "${from}"`);
  }
  const allowed = DELIVERY_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}
