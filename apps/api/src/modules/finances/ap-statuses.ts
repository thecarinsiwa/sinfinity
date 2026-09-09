export const AP_STATUSES = ['open', 'partial', 'paid', 'cancelled'] as const;

export type ApStatus = (typeof AP_STATUSES)[number];

export const AP_STATUS = {
  OPEN: 'open',
  PARTIAL: 'partial',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, ApStatus>;
