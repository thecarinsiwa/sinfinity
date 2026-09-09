export const PURCHASE_ORDER_STATUSES = [
  'draft',
  'sent',
  'confirmed',
  'partial',
  'received',
  'closed',
  'cancelled',
] as const;

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export const PURCHASE_ORDER_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  CONFIRMED: 'confirmed',
  PARTIAL: 'partial',
  RECEIVED: 'received',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, PurchaseOrderStatus>;

/**
 * Forward-only workflow (+ cancel until received).
 * draft → sent → confirmed → partial → received → closed
 * Cancel allowed from draft|sent|confirmed|partial.
 */
export const PURCHASE_ORDER_STATUS_TRANSITIONS: Record<
  PurchaseOrderStatus,
  readonly PurchaseOrderStatus[]
> = {
  draft: ['sent', 'cancelled'],
  sent: ['confirmed', 'cancelled'],
  confirmed: ['partial', 'cancelled'],
  partial: ['received', 'cancelled'],
  received: ['closed'],
  closed: [],
  cancelled: [],
};

export type ReceiptQtyLine = {
  quantity: string | number;
  quantityReceived: string | number;
};

export function assertPurchaseOrderTransition(
  from: PurchaseOrderStatus,
  to: PurchaseOrderStatus,
): void {
  if (from === to) {
    throw new Error(`Purchase order is already "${from}"`);
  }
  const allowed = PURCHASE_ORDER_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

export function assertReceiptQtyInvariants(
  toStatus: PurchaseOrderStatus,
  lines: ReceiptQtyLine[],
): void {
  for (const line of lines) {
    if (Number(line.quantityReceived) > Number(line.quantity)) {
      throw new Error('quantityReceived cannot exceed quantity');
    }
  }

  if (toStatus === PURCHASE_ORDER_STATUS.PARTIAL) {
    const hasPartial = lines.some((line) => {
      const received = Number(line.quantityReceived);
      const quantity = Number(line.quantity);
      return received > 0 && received < quantity;
    });
    if (!hasPartial) {
      throw new Error(
        'partial requires at least one line with 0 < quantityReceived < quantity',
      );
    }
    return;
  }

  if (toStatus === PURCHASE_ORDER_STATUS.RECEIVED) {
    if (lines.length === 0) {
      throw new Error('received requires at least one line item');
    }
    const allComplete = lines.every(
      (line) => Number(line.quantityReceived) >= Number(line.quantity),
    );
    if (!allComplete) {
      throw new Error(
        'received requires quantityReceived >= quantity on every line',
      );
    }
  }
}
