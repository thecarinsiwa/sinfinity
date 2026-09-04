export const PROCUREMENT_QUOTE_STATUSES = [
  'received',
  'shortlisted',
  'selected',
  'rejected',
] as const;

export type ProcurementQuoteStatus =
  (typeof PROCUREMENT_QUOTE_STATUSES)[number];

export const PROCUREMENT_QUOTE_STATUS = {
  RECEIVED: 'received',
  SHORTLISTED: 'shortlisted',
  SELECTED: 'selected',
  REJECTED: 'rejected',
} as const satisfies Record<string, ProcurementQuoteStatus>;

export const PROCUREMENT_QUOTE_STATUS_TRANSITIONS: Record<
  ProcurementQuoteStatus,
  readonly ProcurementQuoteStatus[]
> = {
  received: ['shortlisted', 'rejected'],
  shortlisted: ['selected', 'rejected'],
  selected: ['shortlisted', 'rejected'],
  rejected: [],
};

export function assertProcurementQuoteTransition(
  from: ProcurementQuoteStatus,
  to: ProcurementQuoteStatus,
): void {
  if (from === to) {
    throw new Error(`Procurement quote is already "${from}"`);
  }
  const allowed = PROCUREMENT_QUOTE_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid quote status transition from "${from}" to "${to}"`);
  }
}
