export const SERVICE_REQUEST_STATUSES = [
  'new',
  'assigned',
  'completed',
  'cancelled',
] as const;

export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const SERVICE_REQUEST_STATUS = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, ServiceRequestStatus>;

/**
 * new → assigned|completed|cancelled
 * assigned → completed|cancelled
 * Convert sets completed.
 */
export const SERVICE_REQUEST_STATUS_TRANSITIONS: Record<
  ServiceRequestStatus,
  readonly ServiceRequestStatus[]
> = {
  new: ['assigned', 'completed', 'cancelled'],
  assigned: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function assertServiceRequestTransition(
  from: ServiceRequestStatus,
  to: ServiceRequestStatus,
): void {
  if (from === to) {
    throw new Error(`Service request is already "${from}"`);
  }
  const allowed = SERVICE_REQUEST_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}
