export const PROCUREMENT_REQUEST_STATUSES = [
  'draft',
  'open',
  'quoted',
  'compared',
  'approved',
  'closed',
  'cancelled',
] as const;

export type ProcurementRequestStatus =
  (typeof PROCUREMENT_REQUEST_STATUSES)[number];

export const PROCUREMENT_REQUEST_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  QUOTED: 'quoted',
  COMPARED: 'compared',
  APPROVED: 'approved',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, ProcurementRequestStatus>;

export const PROCUREMENT_REQUEST_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent',
] as const;

export type ProcurementRequestPriority =
  (typeof PROCUREMENT_REQUEST_PRIORITIES)[number];

export const PROCUREMENT_REQUEST_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const satisfies Record<string, ProcurementRequestPriority>;

/** Forward-only workflow (+ cancel). Terminal: closed, cancelled. */
export const PROCUREMENT_REQUEST_STATUS_TRANSITIONS: Record<
  ProcurementRequestStatus,
  readonly ProcurementRequestStatus[]
> = {
  draft: ['open', 'cancelled'],
  open: ['quoted', 'cancelled'],
  quoted: ['compared', 'cancelled'],
  compared: ['approved', 'cancelled'],
  approved: ['closed'],
  closed: [],
  cancelled: [],
};

export function assertProcurementRequestTransition(
  from: ProcurementRequestStatus,
  to: ProcurementRequestStatus,
): void {
  if (from === to) {
    throw new Error(`Procurement request is already "${from}"`);
  }
  const allowed = PROCUREMENT_REQUEST_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}
