export const STOCK_TRANSFER_STATUSES = [
  'draft',
  'in_transit',
  'completed',
  'cancelled',
] as const;

export type StockTransferStatus = (typeof STOCK_TRANSFER_STATUSES)[number];

export const STOCK_TRANSFER_STATUS = {
  DRAFT: 'draft',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, StockTransferStatus>;

/**
 * draft → in_transit → completed
 * Cancel allowed from draft or in_transit.
 */
export const STOCK_TRANSFER_TRANSITIONS: Record<
  StockTransferStatus,
  readonly StockTransferStatus[]
> = {
  draft: ['in_transit', 'cancelled'],
  in_transit: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function assertStockTransferTransition(
  from: StockTransferStatus,
  to: StockTransferStatus,
): void {
  if (from === to) {
    throw new Error(`Stock transfer is already "${from}"`);
  }
  const allowed = STOCK_TRANSFER_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}
