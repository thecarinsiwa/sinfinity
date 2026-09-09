export const INVOICE_STATUSES = [
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, InvoiceStatus>;

/**
 * draft → issued|cancelled
 * issued → partially_paid|paid|overdue|cancelled
 * Payment-driven statuses from issued/partially_paid/overdue.
 */
export const INVOICE_STATUS_TRANSITIONS: Record<
  InvoiceStatus,
  readonly InvoiceStatus[]
> = {
  draft: ['issued', 'cancelled'],
  issued: ['partially_paid', 'paid', 'overdue', 'cancelled'],
  partially_paid: ['paid', 'overdue', 'cancelled'],
  overdue: ['partially_paid', 'paid', 'cancelled'],
  paid: [],
  cancelled: [],
};

export function assertInvoiceTransition(
  from: InvoiceStatus,
  to: InvoiceStatus,
): void {
  if (from === to) {
    throw new Error(`Invoice is already "${from}"`);
  }
  const allowed = INVOICE_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

/** Derive status from amount_paid vs total (issued family only). */
export function invoiceStatusFromPayments(
  amountPaid: string,
  totalAmount: string,
  current: InvoiceStatus,
): InvoiceStatus {
  if (
    current === INVOICE_STATUS.DRAFT ||
    current === INVOICE_STATUS.CANCELLED
  ) {
    return current;
  }
  const paid = Number(amountPaid);
  const total = Number(totalAmount);
  if (paid <= 0) {
    return current === INVOICE_STATUS.OVERDUE
      ? INVOICE_STATUS.OVERDUE
      : INVOICE_STATUS.ISSUED;
  }
  if (paid + 1e-9 >= total) {
    return INVOICE_STATUS.PAID;
  }
  return INVOICE_STATUS.PARTIALLY_PAID;
}
