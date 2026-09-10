export const SUPPLIER_QUOTE_STATUSES = [
  'draft',
  'received',
  'selected',
  'rejected',
  'expired',
] as const;

export type SupplierQuoteStatus = (typeof SUPPLIER_QUOTE_STATUSES)[number];

export const SUPPLIER_QUOTE_STATUS = {
  DRAFT: 'draft',
  RECEIVED: 'received',
  SELECTED: 'selected',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const satisfies Record<string, SupplierQuoteStatus>;

/**
 * draft → received|rejected|expired
 * received → selected|rejected|expired
 * selected|rejected|expired terminal
 */
export const SUPPLIER_QUOTE_STATUS_TRANSITIONS: Record<
  SupplierQuoteStatus,
  readonly SupplierQuoteStatus[]
> = {
  draft: ['received', 'rejected', 'expired'],
  received: ['selected', 'rejected', 'expired'],
  selected: [],
  rejected: [],
  expired: [],
};

export const SUPPLIER_QUOTE_MUTABLE_STATUSES: readonly SupplierQuoteStatus[] = [
  SUPPLIER_QUOTE_STATUS.DRAFT,
  SUPPLIER_QUOTE_STATUS.RECEIVED,
];

export function assertSupplierQuoteTransition(
  from: SupplierQuoteStatus,
  to: SupplierQuoteStatus,
): void {
  if (from === to) {
    throw new Error(`Supplier quote is already "${from}"`);
  }
  const allowed = SUPPLIER_QUOTE_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(
      `Invalid supplier quote status transition from "${from}" to "${to}"`,
    );
  }
}

export function assertSupplierQuoteMutable(status: SupplierQuoteStatus): void {
  if (!SUPPLIER_QUOTE_MUTABLE_STATUSES.includes(status)) {
    throw new Error(
      `Cannot modify a supplier quote in status "${status}"`,
    );
  }
}
