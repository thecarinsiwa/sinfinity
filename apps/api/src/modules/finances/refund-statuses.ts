export const REFUND_STATUSES = ['draft', 'issued', 'applied'] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const REFUND_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  APPLIED: 'applied',
} as const satisfies Record<string, RefundStatus>;

/** draft → issued → applied */
export const REFUND_STATUS_TRANSITIONS: Record<
  RefundStatus,
  readonly RefundStatus[]
> = {
  draft: ['issued'],
  issued: ['applied'],
  applied: [],
};

export function assertRefundTransition(
  from: RefundStatus,
  to: RefundStatus,
): void {
  if (from === to) {
    throw new Error(`Refund is already "${from}"`);
  }
  const allowed = REFUND_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}
