export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const satisfies Record<string, TicketPriority>;

export const TICKET_STATUSES = [
  'open',
  'in_progress',
  'waiting',
  'resolved',
  'closed',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING: 'waiting',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const satisfies Record<string, TicketStatus>;

/**
 * open → in_progress|waiting → resolved → closed
 * Terminal: closed. resolved may close; open may jump to resolved/closed.
 */
export const TICKET_STATUS_TRANSITIONS: Record<
  TicketStatus,
  readonly TicketStatus[]
> = {
  open: ['in_progress', 'waiting', 'resolved', 'closed'],
  in_progress: ['waiting', 'resolved', 'closed'],
  waiting: ['in_progress', 'resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
};

export function assertTicketTransition(
  from: TicketStatus,
  to: TicketStatus,
): void {
  if (from === to) {
    throw new Error(`Ticket is already "${from}"`);
  }
  const allowed = TICKET_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

export function isTicketClosedStatus(status: TicketStatus): boolean {
  return status === TICKET_STATUS.RESOLVED || status === TICKET_STATUS.CLOSED;
}
