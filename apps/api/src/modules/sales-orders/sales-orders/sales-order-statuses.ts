export const SALES_ORDER_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'partially_delivered',
  'delivered',
  'cancelled',
] as const;

export type SalesOrderStatus = (typeof SALES_ORDER_STATUSES)[number];

export const SALES_ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  PARTIALLY_DELIVERED: 'partially_delivered',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, SalesOrderStatus>;

/** Forward-only workflow (+ cancel). No reverse; not from delivered. */
export const SALES_ORDER_STATUS_TRANSITIONS: Record<
  SalesOrderStatus,
  readonly SalesOrderStatus[]
> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['partially_delivered', 'delivered', 'cancelled'],
  partially_delivered: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export type DeliveryQtyLine = {
  quantity: string | number;
  quantityDelivered: string | number;
};

export function assertSalesOrderTransition(
  from: SalesOrderStatus,
  to: SalesOrderStatus,
): void {
  if (from === to) {
    throw new Error(`Sales order is already "${from}"`);
  }
  const allowed = SALES_ORDER_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

export function assertDeliveryQtyInvariants(
  toStatus: SalesOrderStatus,
  lines: DeliveryQtyLine[],
): void {
  for (const line of lines) {
    if (Number(line.quantityDelivered) > Number(line.quantity)) {
      throw new Error('quantityDelivered cannot exceed quantity');
    }
  }

  if (toStatus === SALES_ORDER_STATUS.PARTIALLY_DELIVERED) {
    const anyProgress = lines.some(
      (line) => Number(line.quantityDelivered) > 0,
    );
    const allComplete =
      lines.length > 0 &&
      lines.every(
        (line) => Number(line.quantityDelivered) >= Number(line.quantity),
      );
    if (!anyProgress || allComplete) {
      throw new Error(
        'partially_delivered requires some progress without all lines complete',
      );
    }
    return;
  }

  if (toStatus === SALES_ORDER_STATUS.DELIVERED) {
    if (lines.length === 0) {
      throw new Error('delivered requires at least one line item');
    }
    const allComplete = lines.every(
      (line) => Number(line.quantityDelivered) >= Number(line.quantity),
    );
    if (!allComplete) {
      throw new Error(
        'delivered requires quantityDelivered >= quantity on every line',
      );
    }
  }
}
